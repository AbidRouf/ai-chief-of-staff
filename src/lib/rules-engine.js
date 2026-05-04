export function applyRules(triageResults, rules) {
  if (!rules || rules.length === 0) return triageResults;

  return triageResults.map(item => {
    let modified = { ...item };
    let appliedRule = null;

    for (const rule of rules) {
      const condition = JSON.parse(rule.condition);
      const action = JSON.parse(rule.action);

      if (matchesCondition(item, condition)) {
        if (action.set_category) {
          modified.category = action.set_category;
          modified.overriddenBy = 'rule';
          modified.originalCategory = item.category;
        }
        if (action.flag) {
          if (!modified.flags) modified.flags = [];
          modified.flags.push(action.flag_reason || 'CEO priority rule');
        }
        appliedRule = rule;
      }
    }

    return modified;
  });
}

function matchesCondition(triageItem, condition) {
  const { field, operator, value } = condition;

  let fieldValue = '';
  if (field === 'from') fieldValue = triageItem._message?.sender || triageItem._message?.from || '';
  else if (field === 'subject') fieldValue = triageItem._message?.subject || '';
  else if (field === 'body') fieldValue = triageItem._message?.body || '';
  else if (field === 'channel') fieldValue = triageItem._message?.channel || '';

  const lowerField = fieldValue.toLowerCase();
  const lowerValue = value.toLowerCase();

  switch (operator) {
    case 'contains':
      return lowerField.includes(lowerValue);
    case 'equals':
      return lowerField === lowerValue;
    case 'matches':
      try {
        return new RegExp(value, 'i').test(fieldValue);
      } catch {
        return false;
      }
    default:
      return false;
  }
}
