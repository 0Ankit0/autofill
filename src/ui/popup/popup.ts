import {
  createRequestId,
  type RuntimeRequest,
  type RuntimeResponse
} from '../../shared/messages';
import type { FieldDescriptor, FillFieldResult, GenerationResult } from '../../shared/types';

let fields: FieldDescriptor[] = [];
let generation: GenerationResult | null = null;
let unresolvedFieldIds = new Set<string>();

const summary = document.getElementById('summary')!;
const details = document.getElementById('details')!;
const generateBtn = document.getElementById('generate') as HTMLButtonElement;
const fillBtn = document.getElementById('fill') as HTMLButtonElement;

async function send(request: RuntimeRequest): Promise<RuntimeResponse> {
  return chrome.runtime.sendMessage(request);
}

function renderFillReport(results: FillFieldResult[]) {
  const failed = results.filter((r) => !r.success);
  unresolvedFieldIds = new Set(failed.map((f) => f.fieldId));
  details.textContent = JSON.stringify(
    {
      failed,
      unresolvedFieldIds: [...unresolvedFieldIds]
    },
    null,
    2
  );
}

document.getElementById('scan')!.addEventListener('click', async () => {
  const response = await send({ requestId: createRequestId(), type: 'extract-fields' });
  if (!response.ok) return;
  fields = response.payload.fields;
  unresolvedFieldIds.clear();
  summary.textContent = `Detected ${fields.length} fields.`;
  details.textContent = JSON.stringify(fields.slice(0, 10), null, 2);
  generateBtn.disabled = fields.length === 0;
  fillBtn.disabled = true;
});

generateBtn.addEventListener('click', async () => {
  const response = await send({
    requestId: createRequestId(),
    type: 'generate-values',
    payload: { fields }
  });
  if (!response.ok) return;

  generation = response.payload.generation;
  const warnings = generation.warnings.length
    ? ` Warnings: ${generation.warnings.join('; ')}`
    : '';

  const sourceCounts = Object.values(generation.values).reduce(
    (acc, item) => {
      acc[item.source] = (acc[item.source] ?? 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  summary.textContent = `Generated ${Object.keys(generation.values).length} values.${warnings}`;
  details.textContent = JSON.stringify(
    {
      sources: sourceCounts,
      preview: Object.values(generation.values).slice(0, 10)
    },
    null,
    2
  );
  fillBtn.disabled = false;
});

fillBtn.addEventListener('click', async () => {
  if (!generation) return;

  const onlyUnresolved = unresolvedFieldIds.size > 0;
  const values = onlyUnresolved
    ? Object.fromEntries(
        Object.entries(generation.values).filter(([fieldId]) =>
          unresolvedFieldIds.has(fieldId)
        )
      )
    : generation.values;

  const response = await send({
    requestId: createRequestId(),
    type: 'fill-fields',
    payload: { fields, values }
  });
  if (!response.ok) return;

  const { fill } = response.payload;
  summary.textContent = onlyUnresolved
    ? `Retried unresolved fields: ${fill.successCount} fixed, ${fill.failureCount} still unresolved.`
    : `Filled ${fill.successCount}, failed ${fill.failureCount}.`;
  renderFillReport(fill.fields);
});

document.getElementById('openOptions')!.addEventListener('click', (e) => {
  e.preventDefault();
  chrome.runtime.openOptionsPage();
});
