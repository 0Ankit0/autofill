import type {
  FieldDescriptor,
  FieldLocator,
  FieldOption,
  FieldValidation
} from '../shared/types';

const BASE_SELECTOR =
  'input:not([type="hidden"]):not([type="file"]):not([type="submit"]):not([type="button"]):not([type="reset"]),textarea,select';

function text(element: Element | null): string {
  return element?.textContent?.trim() ?? '';
}

function cssPath(el: Element): string {
  if (el.id) return `#${CSS.escape(el.id)}`;
  const path: string[] = [];
  let node: Element | null = el;
  while (node && node.nodeType === 1 && node !== document.body) {
    const tag = node.tagName.toLowerCase();
    const parent = node.parentElement;
    if (!parent) break;
    const siblings = [...parent.children].filter((c) => c.tagName === node!.tagName);
    const index = siblings.indexOf(node) + 1;
    path.unshift(`${tag}:nth-of-type(${index})`);
    node = parent;
  }
  return path.length ? path.join(' > ') : el.tagName.toLowerCase();
}

function xpathPath(el: Element): string {
  if ((el as HTMLElement).id) {
    return `//*[@id="${(el as HTMLElement).id}"]`;
  }
  const parts: string[] = [];
  let node: Element | null = el;
  while (node && node.nodeType === 1) {
    let ix = 1;
    let sib = node.previousElementSibling;
    while (sib) {
      if (sib.tagName === node.tagName) ix += 1;
      sib = sib.previousElementSibling;
    }
    parts.unshift(`${node.tagName.toLowerCase()}[${ix}]`);
    node = node.parentElement;
  }
  return `/${parts.join('/')}`;
}

function labelFor(el: HTMLElement): string {
  if (el.id) {
    const linked = document.querySelector(`label[for="${CSS.escape(el.id)}"]`);
    if (linked) return text(linked);
  }
  return (
    el.getAttribute('aria-label') ??
    text(el.closest('label')) ??
    el.getAttribute('placeholder') ??
    el.getAttribute('name') ??
    el.id
  );
}

function validationFor(
  el: HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
): FieldValidation {
  return {
    required: el.required || undefined,
    min: 'min' in el && el.min ? Number(el.min) : undefined,
    max: 'max' in el && el.max ? Number(el.max) : undefined,
    minLength:
      'minLength' in el && el.minLength > -1 ? el.minLength : undefined,
    maxLength:
      'maxLength' in el && el.maxLength > -1 ? el.maxLength : undefined,
    pattern: 'pattern' in el ? el.pattern || undefined : undefined,
    step: 'step' in el && el.step ? Number(el.step) : undefined
  };
}

function visible(el: HTMLElement): boolean {
  const rect = el.getBoundingClientRect();
  const style = getComputedStyle(el);
  return !(
    style.display === 'none' ||
    style.visibility === 'hidden' ||
    rect.width === 0 ||
    rect.height === 0
  );
}

function locatorCandidates(el: HTMLElement): FieldLocator[] {
  const candidates: FieldLocator[] = [];
  const name = (el as HTMLInputElement).name || undefined;
  const id = el.id || undefined;
  const css = cssPath(el);
  const xpath = xpathPath(el);

  candidates.push({ css, xpath, name, id });
  if (id) candidates.push({ id, css: `#${CSS.escape(id)}` });
  if (name) {
    candidates.push({ name, css: `[name="${CSS.escape(name)}"]` });
    candidates.push({ name, css: `${el.tagName.toLowerCase()}[name="${CSS.escape(name)}"]` });
  }

  return candidates;
}

function selectOptions(el: HTMLSelectElement): FieldOption[] {
  return [...el.options].map((o) => ({
    value: o.value,
    label: o.label,
    disabled: o.disabled
  }));
}

function radioOrCheckboxOptions(elements: HTMLInputElement[]): FieldOption[] {
  return elements.map((input) => ({
    value: input.value,
    label: labelFor(input),
    disabled: input.disabled
  }));
}

function asSimpleType(el: HTMLElement): FieldDescriptor['type'] {
  if (el instanceof HTMLSelectElement) {
    return el.multiple ? 'select-multiple' : 'select-one';
  }
  if (el instanceof HTMLTextAreaElement) return 'textarea';
  const input = el as HTMLInputElement;
  if (input.type === 'email') return 'email';
  if (input.type === 'tel') return 'tel';
  if (input.type === 'date') return 'date';
  if (input.type === 'number') return 'number';
  if (input.type === 'checkbox') return 'checkbox';
  return 'text';
}

function descriptorFromElement(
  el: HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement,
  typeOverride?: FieldDescriptor['type'],
  options: FieldOption[] = []
): FieldDescriptor {
  const type = typeOverride ?? asSimpleType(el);
  const baseLocator = locatorCandidates(el)[0];

  return {
    fieldId: `${type}:${el.name || el.id || crypto.randomUUID()}`,
    type,
    tagName: el.tagName.toLowerCase(),
    logicalGroup:
      type === 'radio-group' || type === 'checkbox-group'
        ? `${type}:${el.name}`
        : undefined,
    label: labelFor(el),
    placeholder: (el as HTMLInputElement).placeholder,
    autocomplete: (el as HTMLInputElement).autocomplete,
    inputMode: (el as HTMLInputElement).inputMode,
    visible: visible(el),
    locators: baseLocator,
    locatorCandidates: locatorCandidates(el),
    validation: validationFor(el),
    options
  };
}

export function extractFieldDescriptors(
  root: Document | HTMLElement = document
): FieldDescriptor[] {
  const elements = [...root.querySelectorAll(BASE_SELECTOR)].filter(
    (el) => !el.hasAttribute('disabled') && !el.hasAttribute('readonly')
  ) as Array<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>;

  const consumed = new Set<Element>();
  const fields: FieldDescriptor[] = [];

  for (const el of elements) {
    if (consumed.has(el)) continue;

    if (el instanceof HTMLInputElement && el.type === 'radio' && el.name) {
      const group = elements.filter(
        (e): e is HTMLInputElement =>
          e instanceof HTMLInputElement && e.type === 'radio' && e.name === el.name
      );
      group.forEach((member) => consumed.add(member));
      fields.push(
        descriptorFromElement(el, 'radio-group', radioOrCheckboxOptions(group))
      );
      continue;
    }

    if (el instanceof HTMLInputElement && el.type === 'checkbox' && el.name) {
      const group = elements.filter(
        (e): e is HTMLInputElement =>
          e instanceof HTMLInputElement &&
          e.type === 'checkbox' &&
          e.name === el.name
      );
      if (group.length > 1) {
        group.forEach((member) => consumed.add(member));
        fields.push(
          descriptorFromElement(
            el,
            'checkbox-group',
            radioOrCheckboxOptions(group)
          )
        );
        continue;
      }
    }

    const opts = el instanceof HTMLSelectElement ? selectOptions(el) : [];
    fields.push(descriptorFromElement(el, undefined, opts));
    consumed.add(el);
  }

  return fields;
}
