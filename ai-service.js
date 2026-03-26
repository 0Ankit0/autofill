// AI Service for generating form field values

/**
 * Format field data into a prompt for the AI
 * @param {Array} fields - Array of field objects
 * @returns {string} - Formatted prompt
 */
function formatFieldsForPrompt(fields) {
  let prompt = `Generate realistic form field values for the following fields. Return ONLY a valid JSON object with field selectors as keys and values as values.

Fields:
`;

  fields.forEach((field, index) => {
    prompt += `\n${index + 1}. "${field.label || field.name || field.id}" (${field.type})`;
    
    if (field.placeholder) {
      prompt += ` - placeholder: "${field.placeholder}"`;
    }
    
    if (field.options && field.options.length > 0) {
      const opts = field.options.map(opt => opt.value || opt.text).filter(Boolean).slice(0, 5);
      if (opts.length > 0) {
        prompt += ` - options: [${opts.join(', ')}]`;
      }
    }
  });

  prompt += `\n\nGenerate realistic values. Examples:
- Email: john.doe@example.com
- Phone: (555) 123-4567
- Date: 1990-05-15
- Select/Radio: choose from provided options
- Checkbox: true or false
- Names: realistic first/last names
- Addresses: realistic street, city, state, zip

Return ONLY valid JSON like: {"selector1": "value1", "selector2": "value2"}`;

  return prompt;
}

/**
 * Try to use Chrome's built-in AI (Gemini Nano)
 * @param {string} prompt - The prompt to send
 * @returns {Promise<string>} - Generated text response
 */
async function callChromeAI(prompt) {
  try {
    // Check if the Prompt API is available
    if (!window.ai || !window.ai.languageModel) {
      throw new Error('Chrome AI not available');
    }

    // Check if the model is available
    const capabilities = await window.ai.languageModel.capabilities();
    if (capabilities.available === 'no') {
      throw new Error('Chrome AI model not available');
    }

    // Create a session
    const session = await window.ai.languageModel.create({
      temperature: 0.7,
      topK: 3,
    });

    // Generate response
    const response = await session.prompt(prompt);
    
    // Clean up
    session.destroy();
    
    return response;
  } catch (error) {
    throw new Error(`Chrome AI error: ${error.message}`);
  }
}

/**
 * Generate fallback data when AI fails or is unavailable
 * @param {Array} fields - Array of field objects
 * @returns {Object} - Object with selectors as keys and values as values
 */
function generateFallbackData(fields) {
  const fieldValues = {};
  
  // Sample data pools
  const firstNames = ['John', 'Jane', 'Michael', 'Sarah', 'David', 'Emily', 'Robert', 'Lisa', 'James', 'Maria'];
  const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez'];
  const streets = ['Main St', 'Oak Ave', 'Maple Dr', 'Cedar Ln', 'Pine Rd', 'Elm St', 'Washington Blvd', 'Park Ave'];
  const cities = ['New York', 'Los Angeles', 'Chicago', 'Houston', 'Phoenix', 'Philadelphia', 'San Antonio', 'San Diego'];
  const companies = ['Tech Corp', 'Innovation Labs', 'Digital Solutions', 'Global Systems', 'Future Tech', 'Smart Industries'];
  const jobTitles = ['Software Engineer', 'Product Manager', 'Designer', 'Data Analyst', 'Marketing Manager', 'Sales Director'];
  
  const randomItem = (arr) => arr[Math.floor(Math.random() * arr.length)];
  const randomNumber = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
  
  fields.forEach(field => {
    const type = field.type.toLowerCase();
    const label = (field.label || field.name || field.id || '').toLowerCase();
    const name = (field.name || '').toLowerCase();
    const id = (field.id || '').toLowerCase();
    const placeholder = (field.placeholder || '').toLowerCase();
    
    // Combine all identifiers for better matching
    const allText = `${label} ${name} ${id} ${placeholder}`;
    
    let value = '';
    
    // Email fields
    if (type === 'email' || allText.includes('email') || allText.includes('e-mail')) {
      const firstName = randomItem(firstNames).toLowerCase();
      const lastName = randomItem(lastNames).toLowerCase();
      value = `${firstName}.${lastName}@example.com`;
    }
    // Phone/Tel fields
    else if (type === 'tel' || allText.includes('phone') || allText.includes('mobile') || allText.includes('tel')) {
      value = `(${randomNumber(200, 999)}) ${randomNumber(200, 999)}-${randomNumber(1000, 9999)}`;
    }
    // Number fields
    else if (type === 'number' || allText.includes('age') || allText.includes('experience') || allText.includes('years')) {
      const min = field.validation?.min || 1;
      const max = field.validation?.max || 50;
      value = randomNumber(min, max);
    }
    // Date fields
    else if (type === 'date' || allText.includes('birth') || allText.includes('date') || allText.includes('dob')) {
      const year = randomNumber(1970, 2005);
      const month = String(randomNumber(1, 12)).padStart(2, '0');
      const day = String(randomNumber(1, 28)).padStart(2, '0');
      value = `${year}-${month}-${day}`;
    }
    // URL fields
    else if (type === 'url' || allText.includes('website') || allText.includes('url') || allText.includes('link')) {
      value = 'https://example.com';
    }
    // Checkbox fields
    else if (type === 'checkbox') {
      value = Math.random() > 0.5;
    }
    // Radio fields
    else if (type === 'radio' && field.options && field.options.length > 0) {
      value = randomItem(field.options).value;
    }
    // Select fields
    else if ((type === 'select' || type === 'select-one') && field.options && field.options.length > 1) {
      const validOptions = field.options.filter(opt => opt.value);
      if (validOptions.length > 0) {
        value = randomItem(validOptions).value;
      }
    }
    // Textarea and comment fields
    else if (type === 'textarea' || allText.includes('comment') || allText.includes('message') || 
             allText.includes('description') || allText.includes('note') || allText.includes('bio')) {
      value = 'This is a sample comment or message for testing purposes.';
    }
    // Name fields - specific matching
    else if (allText.includes('first') && allText.includes('name')) {
      value = randomItem(firstNames);
    }
    else if (allText.includes('last') && allText.includes('name')) {
      value = randomItem(lastNames);
    }
    else if (allText.includes('full') && allText.includes('name')) {
      value = `${randomItem(firstNames)} ${randomItem(lastNames)}`;
    }
    else if (allText.match(/\b(name|fullname)\b/) && !allText.includes('user') && !allText.includes('company')) {
      value = `${randomItem(firstNames)} ${randomItem(lastNames)}`;
    }
    // Address fields
    else if (allText.includes('street') || allText.includes('address line') || allText.match(/\baddress\b/)) {
      value = `${randomNumber(100, 9999)} ${randomItem(streets)}`;
    }
    else if (allText.includes('city')) {
      value = randomItem(cities);
    }
    else if (allText.includes('state') || allText.includes('province')) {
      value = randomItem(['CA', 'NY', 'TX', 'FL', 'IL']);
    }
    else if (allText.includes('zip') || allText.includes('postal')) {
      value = String(randomNumber(10000, 99999));
    }
    else if (allText.includes('country')) {
      value = randomItem(['USA', 'CAN', 'GBR', 'MEX']);
    }
    // Company/Organization fields
    else if (allText.includes('company') || allText.includes('organization') || allText.includes('employer')) {
      value = randomItem(companies);
    }
    // Job/Title fields
    else if (allText.includes('job') || allText.includes('title') || allText.includes('position') || allText.includes('occupation')) {
      value = randomItem(jobTitles);
    }
    // Username fields
    else if (allText.includes('user') && (allText.includes('name') || allText.includes('id'))) {
      value = randomItem(firstNames).toLowerCase() + randomNumber(10, 99);
    }
    // Password fields
    else if (type === 'password' || allText.includes('password') || allText.includes('pwd')) {
      value = 'Password123!';
    }
    // SSN/Tax ID
    else if (allText.includes('ssn') || allText.includes('social security')) {
      value = `${randomNumber(100, 999)}-${randomNumber(10, 99)}-${randomNumber(1000, 9999)}`;
    }
    // Credit card
    else if (allText.includes('card') || allText.includes('credit')) {
      value = `4532 ${randomNumber(1000, 9999)} ${randomNumber(1000, 9999)} ${randomNumber(1000, 9999)}`;
    }
    // CVV/CVC
    else if (allText.includes('cvv') || allText.includes('cvc') || allText.includes('security code')) {
      value = String(randomNumber(100, 999));
    }
    // Generic text field - try to infer from context
    else if (type === 'text') {
      // Check for common patterns
      if (allText.includes('code')) {
        value = 'ABC' + randomNumber(1000, 9999);
      } else if (allText.includes('id') || allText.includes('number')) {
        value = String(randomNumber(10000, 99999));
      } else if (allText.includes('amount') || allText.includes('price') || allText.includes('cost')) {
        value = String(randomNumber(10, 1000));
      } else if (allText.includes('percent') || allText.includes('%')) {
        value = String(randomNumber(1, 100));
      } else {
        // Last resort - use a generic but reasonable value
        if (field.validation?.minLength && field.validation.minLength > 10) {
          value = 'Sample Text Value';
        } else {
          value = 'Sample';
        }
      }
    }
    
    if (value !== '') {
      fieldValues[field.selector] = value;
    }
  });
  
  return fieldValues;
}

/**
 * Call Google Gemini API
 * @param {string} apiKey - Gemini API key
 * @param {string} prompt - The prompt to send
 * @returns {Promise<Object>} - Parsed response object
 */
async function callGeminiAPI(apiKey, prompt) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`;
  
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      contents: [{
        parts: [{
          text: prompt
        }]
      }],
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 2048,
      }
    })
  });
  
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(`Gemini API error: ${errorData.error?.message || response.statusText}`);
  }
  
  const data = await response.json();
  const generatedText = data.candidates[0]?.content?.parts[0]?.text;
  
  if (!generatedText) {
    throw new Error('No response generated from Gemini API');
  }
  
  return generatedText;
}

/**
 * Call OpenAI API
 * @param {string} apiKey - OpenAI API key
 * @param {string} prompt - The prompt to send
 * @returns {Promise<Object>} - Parsed response object
 */
async function callOpenAIAPI(apiKey, prompt) {
  const url = 'https://api.openai.com/v1/chat/completions';
  
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: 'You are a helpful assistant that generates realistic form field values. Always return valid JSON.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 2000
    })
  });
  
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(`OpenAI API error: ${errorData.error?.message || response.statusText}`);
  }
  
  const data = await response.json();
  const generatedText = data.choices[0]?.message?.content;
  
  if (!generatedText) {
    throw new Error('No response generated from OpenAI API');
  }
  
  return generatedText;
}

/**
 * Parse AI response to extract JSON
 * @param {string} response - Raw AI response
 * @returns {Object} - Parsed field values
 */
function parseAIResponse(response) {
  // Try to extract JSON from the response
  // Sometimes AI wraps JSON in code blocks or adds extra text
  
  let jsonText = response.trim();
  
  // Remove markdown code blocks if present
  jsonText = jsonText.replace(/```json\s*/g, '').replace(/```\s*/g, '');
  
  // Try to find JSON object in the text
  const jsonMatch = jsonText.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    jsonText = jsonMatch[0];
  }
  
  try {
    const parsed = JSON.parse(jsonText);
    return parsed;
  } catch (error) {
    throw new Error('Failed to parse AI response as JSON');
  }
}

/**
 * Generate field values using AI or fallback
 * @param {Array} fields - Array of field objects
 * @param {string} apiKey - API key (optional, only needed for Gemini/OpenAI)
 * @param {string} provider - AI provider ('chrome', 'gemini', or 'openai')
 * @returns {Promise<Object>} - Object with selectors as keys and values as values
 */
async function generateFieldValues(fields, apiKey, provider = 'chrome') {
  if (!fields || fields.length === 0) {
    throw new Error('No fields to generate values for');
  }
  
  const prompt = formatFieldsForPrompt(fields);
  
  try {
    let response;
    
    // Try Chrome's built-in AI first (if selected or as default)
    if (provider === 'chrome' || provider === 'huggingface' || !apiKey) {
      try {
        response = await callChromeAI(prompt);
        const fieldValues = parseAIResponse(response);
        return fieldValues;
      } catch (chromeAIError) {
        // If Chrome AI fails, fall back to data generator
        return generateFallbackData(fields);
      }
    }
    
    // Use external AI providers if API key is provided
    if (provider === 'openai' && apiKey) {
      response = await callOpenAIAPI(apiKey, prompt);
    } else if (provider === 'gemini' && apiKey) {
      response = await callGeminiAPI(apiKey, prompt);
    } else {
      // Default to fallback
      return generateFallbackData(fields);
    }
    
    const fieldValues = parseAIResponse(response);
    return fieldValues;
  } catch (error) {
    // If AI fails, use fallback data generator
    return generateFallbackData(fields);
  }
}

// Export for use in background script
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    generateFieldValues,
    formatFieldsForPrompt,
    parseAIResponse,
    generateFallbackData
  };
}
