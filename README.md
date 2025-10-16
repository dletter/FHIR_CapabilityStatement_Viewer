# FHIR CapabilityStatement Viewer

A modern web application for loading and viewing FHIR CapabilityStatement data in a human-readable format.

## Features

- **URL Input**: Load FHIR CapabilityStatement data from any FHIR server endpoint
- **Human-Readable Display**: Organized presentation of complex FHIR capability data
- **Tabbed Interface**: Easy navigation through different aspects of the capability statement:
  - **Resources**: Supported FHIR resources with their interactions and search parameters
  - **Interactions**: System and resource-level interactions
  - **Operations**: FHIR operations supported by the server
  - **Search Parameters**: Detailed search capabilities by resource type
  - **Security**: Security configuration and requirements
  - **Raw Data**: Complete JSON data for technical review
- **Responsive Design**: Works on desktop, tablet, and mobile devices
- **Error Handling**: Clear error messages for network issues or invalid data

## Getting Started

### Prerequisites

- A modern web browser (Chrome, Firefox, Safari, Edge)
- Internet connection to fetch FHIR CapabilityStatement data

### Installation

1. Clone or download this repository
2. Open `index.html` in your web browser
3. Enter a FHIR CapabilityStatement URL and click "Load CapabilityStatement"

### Example URLs

- `https://fhirr4sandbox.webch.art/webchart.cgi/fhir/metadata` (WebChart FHIR R4 Sandbox)
- `https://hapi.fhir.org/baseR4/metadata` (HAPI FHIR Test Server)
- `https://fhir.epic.com/interconnect-fhir-oauth/api/FHIR/R4/metadata` (Epic FHIR)

## Usage

1. **Enter URL**: Input the FHIR CapabilityStatement endpoint URL
2. **Load Data**: Click "Load CapabilityStatement" or press Enter
3. **Explore**: Use the tabs to navigate through different sections:
   - View supported resources and their capabilities
   - Check available interactions and operations
   - Review search parameters for each resource type
   - Examine security requirements
   - Access raw JSON data

## Project Structure

```
FHIR_CapStatViewer/
├── index.html          # Main HTML file
├── styles.css          # CSS styling
├── app.js             # JavaScript application logic
├── README.md          # This file
└── .github/
    └── copilot-instructions.md  # Development guidelines
```

## Technical Details

- **Frontend**: HTML5, CSS3, ES6+ JavaScript
- **API Communication**: Fetch API with CORS support
- **Data Format**: FHIR R4 CapabilityStatement JSON
- **Browser Compatibility**: Modern browsers supporting ES6+

## Development

### Key Components

- **FHIRCapabilityViewer Class**: Main application controller
- **Data Fetching**: Handles HTTP requests with proper error handling
- **Data Parsing**: Extracts and organizes FHIR capability data
- **UI Rendering**: Dynamic content generation for different data views
- **Responsive Design**: Mobile-first CSS with flexbox and grid layouts

### Customization

The application can be extended to support:
- Additional FHIR resource types
- Custom data visualization
- Export functionality
- Multiple CapabilityStatement comparison
- Integration with FHIR testing tools

## Browser Support

- Chrome 60+
- Firefox 55+
- Safari 12+
- Edge 79+

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is open source and available under the [MIT License](LICENSE).

## Support

For issues or questions:
1. Check the browser console for error messages
2. Verify the FHIR endpoint is accessible and returns valid JSON
3. Ensure CORS is properly configured on the FHIR server
4. Review the FHIR specification for CapabilityStatement format