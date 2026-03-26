# 🤖 AI Form Autofill - Browser Extension

An intelligent Chrome browser extension that uses AI to automatically fill web forms with realistic data. Perfect for testing, development, or quickly filling out repetitive forms.

## ✨ Features

- 🔍 **Automatic Field Detection**: Detects all form fields including text inputs, selects, checkboxes, and radio buttons
- 🧠 **AI-Powered Generation**: Uses AI to generate realistic, context-aware values
- 🆓 **Works Out-of-the-Box**: Uses free Hugging Face models by default - no API key required!
- 🎯 **Validation-Aware**: Respects field validation rules (required, pattern, min/max, etc.)
- 🎨 **Beautiful UI**: Clean, modern popup interface with gradient design
- ⚡ **Fast & Easy**: Fill individual fields or all fields at once with one click
- 🔒 **Secure**: Optional API keys stored locally in your browser, never transmitted elsewhere
- 🌐 **Multiple AI Providers**: Choose between Hugging Face (free), Google Gemini, or OpenAI

## 📦 Installation

### Load as Unpacked Extension (Development Mode)

1. **Open Chrome Extensions Page**
   - Navigate to `chrome://extensions/`
   - Or click the three dots menu → More Tools → Extensions

2. **Enable Developer Mode**
   - Toggle the "Developer mode" switch in the top right corner

3. **Load the Extension**
   - Click "Load unpacked"
   - Select the `/Users/ankit/Projects/Python/autofill` folder

4. **Verify Installation**
   - You should see the AI Form Autofill extension with the purple icon
   - Pin it to your toolbar for easy access

5. **You're Ready!**
   - No configuration needed - the extension works immediately with the free Hugging Face provider
   - (Optional) Configure a different AI provider in Settings if desired

## ⚙️ Configuration

### 🆓 Hugging Face (Default - No Setup Required!)

The extension works **immediately out-of-the-box** using free Hugging Face models:
- **No API key required**
- **No signup needed**
- **Unlimited usage**
- Uses Mistral-7B-Instruct model
- Just install and start using!

### Google Gemini (Optional - Free tier available)

If you prefer Google Gemini:

1. Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Sign in with your Google account
3. Click "Create API Key"
4. Copy the key and paste it into the extension settings
5. Free tier: 60 requests per minute

### OpenAI (Optional - Paid)

If you prefer OpenAI:

1. Visit [OpenAI API Keys](https://platform.openai.com/api-keys)
2. Create an account and add a payment method
3. Generate a new API key
4. In extension Settings, select "OpenAI GPT-3.5"
5. Paste your API key and save

## 🚀 Usage

### Quick Start (Zero Configuration!)

1. **Navigate to any web page with a form**
   - Try the included `test-form.html` file

2. **Open the extension**
   - Click the extension icon in your toolbar

3. **Generate values**
   - Click "Generate Values" to let AI analyze fields and create appropriate values
   - Wait a few seconds for the AI to generate values (using free Hugging Face model)

4. **Fill the form**
   - **Option 1**: Click "Fill All Fields" to fill everything at once
   - **Option 2**: Review each value and click individual "Fill" buttons
   - **Option 3**: Edit any value manually before filling

### Testing the Extension

A comprehensive test form is included in `test-form.html`:

1. Open `test-form.html` in Chrome
2. Click the extension icon
3. Test the AI generation and form filling features

The test form includes:
- Personal information (name, email, phone, date)
- Address fields (street, city, state, ZIP)
- Professional information (company, job title, experience)
- Select dropdowns
- Radio buttons
- Checkboxes
- Text areas

## 📁 Project Structure

```
autofill/
├── manifest.json          # Extension configuration
├── background.js          # Service worker (handles AI API calls)
├── content.js            # Content script (detects and fills fields)
├── ai-service.js         # AI integration module
├── utils.js              # Helper functions
├── popup.html            # Extension popup interface
├── popup.css             # Popup styles
├── popup.js              # Popup logic
├── options.html          # Settings page
├── options.js            # Settings logic
├── test-form.html        # Test form for development
├── icons/                # Extension icons
│   ├── icon16.png        # 16x16 icon
│   ├── icon48.png        # 48x48 icon
│   └── icon128.png       # 128x128 icon
└── README.md             # This file
```

## 🛠️ Technical Details

### Supported Field Types

- Text inputs (text, email, tel, url, password)
- Number inputs (with min/max validation)
- Date inputs
- Select dropdowns (single and multiple)
- Radio buttons
- Checkboxes
- Text areas

### Excluded Field Types

- File inputs
- Submit buttons
- Reset buttons
- Hidden fields
- Disabled or readonly fields

### AI Prompt Engineering

The extension sends field metadata to the AI:
- Field name, label, and placeholder text
- Field type
- Validation requirements (required, pattern, min, max, etc.)
- Available options (for selects and radios)
- Autocomplete hints

The AI returns a JSON object with field selectors as keys and generated values.

## 🔧 Development

### Making Changes

1. Edit the source files
2. Go to `chrome://extensions/`
3. Click the refresh icon on the AI Form Autofill extension
4. Test your changes

### Debugging

- **Background script**: Right-click extension icon → Inspect popup → Console tab
- **Content script**: Open DevTools on the web page → Console tab
- **Popup**: Right-click extension icon → Inspect popup

### Common Issues

**Extension not detecting fields:**
- Refresh the web page
- Open DevTools and check console for errors
- Make sure the content script is injected

**AI not generating values:**
- Check that API key is configured in settings
- Verify API key is valid
- Check console for error messages
- Ensure you're not hitting rate limits

**Fields not filling:**
- Some websites use custom form libraries that prevent programmatic filling
- Try clicking on the field first, then filling
- Check if the field is disabled or readonly

## 🌟 Best Practices

1. **Review generated values** before submitting forms
2. **Test on your own forms** before using on production sites
3. **Keep your API key secure** - don't share it
4. **Monitor API usage** to avoid unexpected charges (for paid providers)
5. **Use realistic data** for testing purposes only

## 📝 License

This project is provided as-is for educational and development purposes.

## 🤝 Contributing

Feel free to fork and modify this extension for your needs!

## 🐛 Known Limitations

- Some dynamically loaded forms may require page refresh
- Custom styled form elements may not be detected
- Some websites block programmatic form filling
- File inputs are not supported
- Captchas and security fields are excluded

## 🔮 Future Enhancements

- [ ] Support for more AI providers (Anthropic Claude, etc.)
- [ ] Custom templates for common form types
- [ ] Form history and value caching
- [ ] Keyboard shortcuts
- [ ] Dark mode theme
- [ ] Multi-language support
- [ ] Export/import settings
- [ ] Firefox compatibility

---

**Made with ❤️ for developers who hate filling out forms repeatedly!**
