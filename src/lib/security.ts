/**
 * HARDENED DOM SANITIZATION ENGINE (Feature 46) & VALIDATOR (Feature 25)
 */
export const Security = {
  escape(str: unknown): string {
    if (typeof str !== 'string') return '';
    const map: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#x27;',
      '/': '&#x2F;'
    };
    return str.replace(/[&<>"'/]/g, char => map[char] || char);
  },

  stripHtml(html: string): string {
    if (typeof html !== 'string') return '';
    return html.replace(/<[^>]*>?/gm, '');
  },

  setText(element: HTMLElement | null, text: string): void {
    if (element) {
      element.textContent = text;
    }
  },

  /**
   * JSON Schema Validator (Feature 25)
   * Validates imported scam profile JSON against required properties and types
   */
  validateScamPayload(payload: any): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!payload || typeof payload !== 'object') {
      return { valid: false, errors: ['Payload must be a valid JSON object'] };
    }

    if (!payload.id || typeof payload.id !== 'string') {
      errors.push('Missing or invalid property: id (string)');
    }
    if (!payload.name || typeof payload.name !== 'string') {
      errors.push('Missing or invalid property: name (string)');
    }
    if (!payload.type || typeof payload.type !== 'string') {
      errors.push('Missing or invalid property: type (string)');
    }
    if (!payload.narrative || typeof payload.narrative !== 'string') {
      errors.push('Missing or invalid property: narrative (string)');
    }
    if (typeof payload.successRate !== 'number' || payload.successRate < 0 || payload.successRate > 100) {
      errors.push('Invalid successRate (must be number between 0 and 100)');
    }
    if (!Array.isArray(payload.mitreTechniques)) {
      errors.push('mitreTechniques must be an array of strings');
    }
    if (!Array.isArray(payload.jagexRules)) {
      errors.push('jagexRules must be an array of strings');
    }
    if (!Array.isArray(payload.dialogueTree)) {
      errors.push('dialogueTree must be an array of dialogue nodes');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }
};
