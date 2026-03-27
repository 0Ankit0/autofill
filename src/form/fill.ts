import type {
  FieldDescriptor,
  FillFieldResult,
  FillResult,
  GeneratedFieldValue
} from '../shared/types';

function queryByXpath(xpath: string): HTMLElement | null {
  try {
    const node = document.evaluate(
      xpath,
      document,
      null,
      XPathResult.FIRST_ORDERED_NODE_TYPE,
      null
    ).singleNodeValue;
    return node instanceof HTMLElement ? node : null;
  } catch {
    return null;
  }
}

function resolveField(field: FieldDescriptor): HTMLElement | null {
  const checks = [field.locators, ...field.locatorCandidates];
  for (const locator of checks) {
    if (locator.id) {
      const byId = document.getElementById(locator.id);
      if (byId) return byId;
    }
    if (locator.css) {
      const byCss = document.querySelector(locator.css);
      if (byCss instanceof HTMLElement) return byCss;
    }
    if (locator.name) {
      const byName = document.querySelector(`[name="${CSS.escape(locator.name)}"]`);
      if (byName instanceof HTMLElement) return byName;
    }
    if (locator.xpath) {
      const byXpath = queryByXpath(locator.xpath);
      if (byXpath) return byXpath;
    }
  }
  return null;
}

function setNativeValue(
  el: HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement,
  value: string
) {
  const descriptor = Object.getOwnPropertyDescriptor(
    Object.getPrototypeOf(el),
    'value'
  );
  descriptor?.set?.call(el, value);
}

function emit(el: HTMLElement) {
  ['focus', 'input', 'change', 'blur'].forEach((type) =>
    el.dispatchEvent(new Event(type, { bubbles: true }))
  );
}

function fillLogicalGroup(
  field: FieldDescriptor,
  generated: GeneratedFieldValue
): boolean {
  const name = field.locators.name;
  if (!name) return false;

  const members = [...document.querySelectorAll<HTMLInputElement>(`input[name="${CSS.escape(name)}"]`)];
  if (!members.length) return false;

  if (field.type === 'radio-group') {
    const value = String(generated.value);
    const target = members.find((m) => m.value === value) ?? members[0];
    target.checked = true;
    target.click();
    emit(target);
    return true;
  }

  if (field.type === 'checkbox-group') {
    const chosen = Array.isArray(generated.value)
      ? new Set(generated.value.map(String))
      : new Set([String(generated.value)]);
    members.forEach((member) => {
      member.checked = chosen.has(member.value);
      emit(member);
    });
    return true;
  }

  return false;
}

export function fillFields(
  fields: FieldDescriptor[],
  values: Record<string, GeneratedFieldValue>
): FillResult {
  const byId = new Map(fields.map((f) => [f.fieldId, f]));
  const results: FillFieldResult[] = [];

  for (const [fieldId, generated] of Object.entries(values)) {
    const descriptor = byId.get(fieldId);
    if (!descriptor) {
      results.push({
        fieldId,
        success: false,
        reason: 'DESCRIPTOR_NOT_FOUND',
        recoveryHint: 'Re-scan fields before retrying unresolved items.'
      });
      continue;
    }

    try {
      if (
        descriptor.type === 'radio-group' ||
        descriptor.type === 'checkbox-group'
      ) {
        const ok = fillLogicalGroup(descriptor, generated);
        results.push(
          ok
            ? { fieldId, success: true }
            : {
                fieldId,
                success: false,
                reason: 'GROUP_NOT_FOUND',
                recoveryHint:
                  'Group was rerendered; re-scan fields and retry unresolved.'
              }
        );
        continue;
      }

      const el = resolveField(descriptor);
      if (!el) {
        results.push({
          fieldId,
          success: false,
          reason: 'FIELD_NOT_FOUND',
          recoveryHint:
            'Field locator is stale after DOM updates; re-scan and retry unresolved.'
        });
        continue;
      }

      if (el instanceof HTMLInputElement && el.type === 'checkbox') {
        el.checked = Boolean(generated.value);
        el.click();
      } else if (
        el instanceof HTMLInputElement ||
        el instanceof HTMLTextAreaElement ||
        el instanceof HTMLSelectElement
      ) {
        setNativeValue(el, String(generated.value));
      }

      emit(el);
      results.push({ fieldId, success: true });
    } catch {
      results.push({
        fieldId,
        success: false,
        reason: 'FILL_FAILED',
        recoveryHint: 'Field exists but rejected value/event sequence.'
      });
    }
  }

  const successCount = results.filter((r) => r.success).length;
  return {
    successCount,
    failureCount: results.length - successCount,
    fields: results
  };
}
