import type {
  FieldDescriptor,
  GeneratedFieldValue,
  GenerationEngine,
  GenerationRequest,
  GenerationResult
} from '../shared/types';
import { createRng, pickOne } from './random';

const DATA = {
  'en-US': {
    first: ['Avery', 'Jordan', 'Taylor', 'Riley', 'Alex'],
    last: ['Nguyen', 'Patel', 'Garcia', 'Smith', 'Johnson'],
    phone: ['4155550134', '6285550198', '2125550114'],
    country: 'United States',
    state: 'CA',
    city: 'San Francisco',
    postal: '94105',
    address1: '123 Market St'
  },
  'en-GB': {
    first: ['Oliver', 'Mia', 'Noah', 'Amelia', 'Sophia'],
    last: ['Smith', 'Jones', 'Taylor', 'Brown', 'Wilson'],
    phone: ['02079460000', '01632960001'],
    country: 'United Kingdom',
    state: 'London',
    city: 'London',
    postal: 'SW1A 1AA',
    address1: '10 Downing Street'
  }
} as const;

type SemanticKind =
  | 'firstName'
  | 'lastName'
  | 'fullName'
  | 'email'
  | 'phone'
  | 'country'
  | 'state'
  | 'city'
  | 'postal'
  | 'address1'
  | 'date'
  | 'number'
  | 'checkbox'
  | 'option'
  | 'freeText';

function classify(field: FieldDescriptor): SemanticKind {
  const text = `${field.label} ${field.locators.name ?? ''} ${field.autocomplete ?? ''} ${field.placeholder ?? ''}`.toLowerCase();
  if (/(given-name|first|fname)/.test(text)) return 'firstName';
  if (/(family-name|last|lname|surname)/.test(text)) return 'lastName';
  if (/(full name|name)/.test(text)) return 'fullName';
  if (/(email|e-mail)/.test(text) || field.type === 'email') return 'email';
  if (/(phone|tel|mobile)/.test(text) || field.type === 'tel') return 'phone';
  if (/country/.test(text)) return 'country';
  if (/(state|province|region|county)/.test(text)) return 'state';
  if (/(city|town)/.test(text)) return 'city';
  if (/(postal|zip|postcode)/.test(text)) return 'postal';
  if (/(address|street|line1)/.test(text)) return 'address1';
  if (field.type === 'date') return 'date';
  if (field.type === 'checkbox' || field.type === 'checkbox-group') return 'checkbox';
  if (
    field.type === 'radio-group' ||
    field.type === 'select-one' ||
    field.type === 'select-multiple'
  )
    return 'option';
  if (field.type === 'number') return 'number';
  return 'freeText';
}

function parseDateBoundary(raw?: number): Date | null {
  if (!raw || Number.isNaN(raw)) return null;
  return new Date(raw);
}

function clampText(value: string, maxLength?: number): string {
  if (!maxLength || maxLength < 1) return value;
  return value.slice(0, maxLength);
}

export class OfflineSemanticEngine implements GenerationEngine {
  async generate(request: GenerationRequest): Promise<GenerationResult> {
    const rng = createRng(request.seed);
    const localeBucket =
      DATA[request.locale as keyof typeof DATA] ?? DATA['en-US'];
    const first = pickOne(rng, [...localeBucket.first]);
    const last = pickOne(rng, [...localeBucket.last]);

    const profile = {
      first,
      last,
      fullName: `${first} ${last}`,
      email: `${first}.${last}@example.test`.toLowerCase(),
      phone: pickOne(rng, [...localeBucket.phone]),
      country: localeBucket.country,
      state: localeBucket.state,
      city: localeBucket.city,
      postal: localeBucket.postal,
      address1: localeBucket.address1
    };

    const values: Record<string, GeneratedFieldValue> = {};
    const warnings: string[] = [];

    for (const field of request.fields) {
      const kind = classify(field);
      const value = this.valueFor(kind, field, profile, rng);
      values[field.fieldId] = {
        fieldId: field.fieldId,
        value,
        source: 'offline-semantic'
      };
      if (field.validation.pattern) {
        try {
          const regex = new RegExp(field.validation.pattern);
          if (typeof value === 'string' && !regex.test(value)) {
            warnings.push(
              `${field.fieldId}: generated value may not satisfy pattern.`
            );
          }
        } catch {
          warnings.push(`${field.fieldId}: invalid field regex pattern.`);
        }
      }
    }

    return { values, warnings };
  }

  private valueFor(
    kind: SemanticKind,
    field: FieldDescriptor,
    profile: {
      first: string;
      last: string;
      fullName: string;
      email: string;
      phone: string;
      country: string;
      state: string;
      city: string;
      postal: string;
      address1: string;
    },
    rng: () => number
  ): string | string[] | boolean {
    switch (kind) {
      case 'firstName':
        return clampText(profile.first, field.validation.maxLength);
      case 'lastName':
        return clampText(profile.last, field.validation.maxLength);
      case 'fullName':
        return clampText(profile.fullName, field.validation.maxLength);
      case 'email':
        return clampText(profile.email, field.validation.maxLength);
      case 'phone':
        return clampText(profile.phone, field.validation.maxLength);
      case 'country':
        return this.pickBestOption(field, profile.country);
      case 'state':
        return this.pickBestOption(field, profile.state);
      case 'city':
        return clampText(profile.city, field.validation.maxLength);
      case 'postal':
        return clampText(profile.postal, field.validation.maxLength);
      case 'address1':
        return clampText(profile.address1, field.validation.maxLength);
      case 'date': {
        const minDate = parseDateBoundary(field.validation.min);
        const maxDate = parseDateBoundary(field.validation.max);
        const fallback = new Date('1997-07-16T00:00:00.000Z');
        const date =
          minDate && maxDate
            ? new Date(
                minDate.getTime() + rng() * (maxDate.getTime() - minDate.getTime())
              )
            : fallback;
        return date.toISOString().slice(0, 10);
      }
      case 'number': {
        const min = field.validation.min ?? 1;
        const max = field.validation.max ?? min + 100;
        const raw = min + rng() * (max - min);
        const step = field.validation.step ?? 1;
        const rounded = Math.round(raw / step) * step;
        return String(Math.max(min, Math.min(max, rounded)));
      }
      case 'checkbox':
        return true;
      case 'option': {
        if (field.type === 'select-multiple') {
          const first = field.options.find((o) => !o.disabled)?.value;
          return first ? [first] : [];
        }
        return this.pickBestOption(field, 'yes');
      }
      default:
        return clampText(profile.fullName, field.validation.maxLength);
    }
  }

  private pickBestOption(field: FieldDescriptor, preferred: string): string {
    if (!field.options.length) return preferred;
    const normalized = preferred.toLowerCase();
    const match = field.options.find(
      (opt) =>
        !opt.disabled &&
        (opt.value.toLowerCase() === normalized ||
          opt.label.toLowerCase() === normalized ||
          opt.label.toLowerCase().includes(normalized))
    );
    return (match ?? field.options.find((o) => !o.disabled) ?? field.options[0]).value;
  }
}
