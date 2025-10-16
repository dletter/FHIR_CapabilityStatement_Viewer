// FHIR CapabilityStatement Viewer Application
class FHIRCapabilityViewer {
    constructor() {
        this.capabilityData = null;
        this.initializeEventListeners();
        this.checkUrlParameters();
    }

    initializeEventListeners() {
        // Load button click handler
        document.getElementById('load-button').addEventListener('click', () => {
            this.loadCapabilityStatement();
        });

        // Enter key handler for URL input
        document.getElementById('fhir-url').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.loadCapabilityStatement();
            }
        });

        // Demo button click handler
        document.getElementById('demo-button').addEventListener('click', () => {
            this.loadDemoData();
        });

        // Tab switching handlers
        document.querySelectorAll('.tab-button').forEach(button => {
            button.addEventListener('click', (e) => {
                this.switchTab(e.target.dataset.tab);
            });
        });

        // Permalink button handler
        document.getElementById('permalink-link').addEventListener('click', (e) => {
            e.preventDefault();
            this.generatePermalink();
        });
    }

    async loadCapabilityStatement() {
        const urlInput = document.getElementById('fhir-url');
        const url = urlInput.value.trim();

        if (!url) {
            this.showError('Please enter a valid FHIR CapabilityStatement URL');
            return;
        }

        if (!this.isValidUrl(url)) {
            this.showError('Please enter a valid URL format');
            return;
        }

        this.showLoading();
        this.hideError();
        this.hideResults();

        try {
            // Try multiple approaches to handle CORS
            let response;
            let data;
            
            // First, try direct fetch
            try {
                response = await fetch(`${url}${url.includes('?') ? '&' : '?'}_format=json`, {
                    method: 'GET',
                    mode: 'cors',
                    headers: {
                        'Accept': 'application/fhir+json, application/json'
                    }
                });

                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                }

                data = await response.json();
            } catch (corsError) {
                console.log('Direct fetch failed, trying CORS proxy...', corsError);
                
                // If direct fetch fails due to CORS, try using a CORS proxy
                const proxyUrl = 'https://api.allorigins.win/raw?url=';
                const proxiedUrl = proxyUrl + encodeURIComponent(`${url}${url.includes('?') ? '&' : '?'}_format=json`);
                
                response = await fetch(proxiedUrl, {
                    method: 'GET',
                    headers: {
                        'Accept': 'application/json'
                    }
                });

                if (!response.ok) {
                    throw new Error(`Proxy request failed: HTTP ${response.status}: ${response.statusText}`);
                }

                const responseText = await response.text();
                try {
                    data = JSON.parse(responseText);
                } catch (parseError) {
                    // If JSON parsing fails, the response might be HTML error page
                    if (responseText.includes('<html>') || responseText.includes('<!DOCTYPE')) {
                        throw new Error('The server returned an HTML page instead of JSON. This might indicate the URL is incorrect or the server is not responding properly.');
                    }
                    throw new Error('Invalid JSON response from server');
                }
            }
            
            if (!this.isValidCapabilityStatement(data)) {
                throw new Error('The response does not appear to be a valid FHIR CapabilityStatement');
            }

            this.capabilityData = data;
            this.displayCapabilityStatement();
            
        } catch (error) {
            console.error('Error loading CapabilityStatement:', error);
            
            let errorMessage = error.message;
            
            // Provide more helpful error messages for common issues
            if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
                errorMessage = `Network error: Unable to fetch data from the FHIR server. This might be due to:
                • CORS (Cross-Origin Resource Sharing) restrictions
                • Network connectivity issues
                • Invalid URL or server not responding
                
                Try:
                • Checking if the URL is correct and accessible in a browser
                • Using a different FHIR server that allows CORS
                • Running this application from an HTTPS server instead of file://`;
            } else if (error.message.includes('Proxy request failed')) {
                errorMessage = `Both direct connection and proxy failed. The FHIR server might be:
                • Temporarily unavailable
                • Requiring authentication
                • Behind a firewall that blocks external access
                
                Please verify the URL is correct and try again later.`;
            }
            
            this.showError(errorMessage);
        } finally {
            this.hideLoading();
        }
    }

    isValidUrl(string) {
        try {
            new URL(string);
            return true;
        } catch (_) {
            return false;
        }
    }

    isValidCapabilityStatement(data) {
        return data && 
               data.resourceType === 'CapabilityStatement' &&
               data.fhirVersion;
    }

    showLoading() {
        document.getElementById('loading-section').style.display = 'block';
        document.getElementById('load-button').disabled = true;
    }

    hideLoading() {
        document.getElementById('loading-section').style.display = 'none';
        document.getElementById('load-button').disabled = false;
    }

    showError(message) {
        document.getElementById('error-text').textContent = message;
        document.getElementById('error-section').style.display = 'block';
    }

    hideError() {
        document.getElementById('error-section').style.display = 'none';
    }

    hideResults() {
        document.getElementById('results-section').style.display = 'none';
    }

    showResults() {
        document.getElementById('results-section').style.display = 'block';
    }

    displayCapabilityStatement() {
        this.renderOverview();
        this.renderResources();
        this.renderInteractions();
        this.renderOperations();
        this.renderSearchParameters();
        this.renderSecurity();
        this.renderRawData();
        this.showResults();
    }

    renderOverview() {
        const data = this.capabilityData;
        const overviewContent = document.getElementById('overview-content');
        
        const overviewHtml = `
            <div class="overview-grid">
                <div class="overview-card">
                    <h3>Server Name</h3>
                    <p>${data.name || 'Not specified'}</p>
                </div>
                <div class="overview-card">
                    <h3>FHIR Version</h3>
                    <p>${data.fhirVersion}</p>
                </div>
                <div class="overview-card">
                    <h3>Status</h3>
                    <p>${data.status || 'Unknown'}</p>
                </div>
                <div class="overview-card">
                    <h3>Date</h3>
                    <p>${data.date ? new Date(data.date).toLocaleDateString() : 'Not specified'}</p>
                </div>
                <div class="overview-card">
                    <h3>Publisher</h3>
                    <p>${data.publisher || 'Not specified'}</p>
                </div>
                <div class="overview-card">
                    <h3>Software/Name</h3>
                    <p>${data.software?.name || 'Not specified'}</p>
                </div>
                <div class="overview-card">
                    <h3>Kind</h3>
                    <p>${data.kind || 'Not specified'}</p>
                </div>
            </div>
            ${this.renderContactInfo(data.contact)}
            ${data.description ? `<div style="margin-top: 1rem;"><h3>Description</h3><p>${data.description}</p></div>` : ''}
        `;
        
        overviewContent.innerHTML = overviewHtml;
    }

    renderContactInfo(contacts) {
        if (!contacts || contacts.length === 0) {
            return '';
        }

        let contactHtml = '<div style="margin-top: 1.5rem;"><h3>Contact Information</h3>';
        
        contacts.forEach((contact, index) => {
            contactHtml += '<div class="contact-card">';
            
            // Contact name
            if (contact.name) {
                contactHtml += `<div class="contact-field"><strong>Name:</strong> ${contact.name}</div>`;
            }
            
            // Telecom information (phone, email, url, etc.)
            if (contact.telecom && contact.telecom.length > 0) {
                contact.telecom.forEach(telecom => {
                    const system = telecom.system || 'contact';
                    const value = telecom.value || '';
                    const use = telecom.use ? ` (${telecom.use})` : '';
                    
                    if (value) {
                        let displayValue = value;
                        
                        // Make URLs clickable
                        if (system === 'url' || value.startsWith('http')) {
                            displayValue = `<a href="${value}" target="_blank" rel="noopener noreferrer">${value}</a>`;
                        }
                        // Make emails clickable
                        else if (system === 'email' || value.includes('@')) {
                            displayValue = `<a href="mailto:${value}">${value}</a>`;
                        }
                        
                        contactHtml += `<div class="contact-field"><strong>${system.charAt(0).toUpperCase() + system.slice(1)}:</strong> ${displayValue}${use}</div>`;
                    }
                });
            }
            
            contactHtml += '</div>';
            
            // Add separator between multiple contacts
            if (index < contacts.length - 1) {
                contactHtml += '<hr class="contact-separator">';
            }
        });
        
        contactHtml += '</div>';
        return contactHtml;
    }

    renderResources() {
        const resourcesTab = document.getElementById('resources-tab');
        const resources = this.capabilityData.rest?.[0]?.resource || [];
        
        if (resources.length === 0) {
            resourcesTab.innerHTML = '<p>No resources found in this CapabilityStatement.</p>';
            return;
        }

        const resourcesHtml = resources.map((resource, index) => {
            const interactions = resource.interaction?.map(i => i.code).join(', ') || 'None';
            const searchParams = resource.searchParam?.map(p => p.name).join(', ') || 'None';
            
            return `
                <div class="resource-card">
                    <div class="resource-header" onclick="this.parentElement.querySelector('.resource-content').classList.toggle('active'); this.querySelector('.toggle').textContent = this.querySelector('.toggle').textContent === '+' ? '−' : '+';">
                        <h3>${resource.type}</h3>
                        <span class="toggle">+</span>
                    </div>
                    <div class="resource-content">
                        <div><strong>Profile:</strong> ${resource.profile || 'Not specified'}</div>
                        <div><strong>Supported Interactions:</strong></div>
                        <div class="interaction-list">
                            ${resource.interaction?.map(i => `<span class="interaction-tag">${i.code}</span>`).join('') || '<span>None</span>'}
                        </div>
                        ${resource.searchParam ? `
                            <div class="search-params">
                                <strong>Search Parameters:</strong>
                                ${resource.searchParam.map(p => `
                                    <div class="search-param">
                                        <strong>${p.name}</strong> (${p.type}) - ${p.documentation || 'No documentation'}
                                    </div>
                                `).join('')}
                            </div>
                        ` : ''}
                        ${resource.versioning ? `<div><strong>Versioning:</strong> ${resource.versioning}</div>` : ''}
                        ${resource.readHistory !== undefined ? `<div><strong>Read History:</strong> ${resource.readHistory}</div>` : ''}
                        ${resource.updateCreate !== undefined ? `<div><strong>Update Create:</strong> ${resource.updateCreate}</div>` : ''}
                        ${resource.conditionalCreate !== undefined ? `<div><strong>Conditional Create:</strong> ${resource.conditionalCreate}</div>` : ''}
                        ${resource.conditionalRead ? `<div><strong>Conditional Read:</strong> ${resource.conditionalRead}</div>` : ''}
                        ${resource.conditionalUpdate !== undefined ? `<div><strong>Conditional Update:</strong> ${resource.conditionalUpdate}</div>` : ''}
                        ${resource.conditionalDelete ? `<div><strong>Conditional Delete:</strong> ${resource.conditionalDelete}</div>` : ''}
                    </div>
                </div>
            `;
        }).join('');

        resourcesTab.innerHTML = `
            <h3>Supported Resources (${resources.length})</h3>
            <div class="resource-grid">
                ${resourcesHtml}
            </div>
        `;
    }

    renderInteractions() {
        const interactionsTab = document.getElementById('interactions-tab');
        const rest = this.capabilityData.rest?.[0];
        
        if (!rest) {
            interactionsTab.innerHTML = '<p>No REST interface information found.</p>';
            return;
        }

        let interactionsHtml = `
            <h3>System-Level Interactions</h3>
            <div class="interaction-list">
                ${rest.interaction?.map(i => `<span class="interaction-tag">${i.code}</span>`).join('') || '<span>None specified</span>'}
            </div>
        `;

        if (rest.mode) {
            interactionsHtml += `<div style="margin-top: 1rem;"><strong>Mode:</strong> ${rest.mode}</div>`;
        }

        if (rest.documentation) {
            interactionsHtml += `<div style="margin-top: 1rem;"><strong>Documentation:</strong> ${rest.documentation}</div>`;
        }

        // Collect all resource-level interactions
        const resourceInteractions = {};
        rest.resource?.forEach(resource => {
            resource.interaction?.forEach(interaction => {
                if (!resourceInteractions[interaction.code]) {
                    resourceInteractions[interaction.code] = [];
                }
                resourceInteractions[interaction.code].push(resource.type);
            });
        });

        if (Object.keys(resourceInteractions).length > 0) {
            interactionsHtml += `
                <h3 style="margin-top: 2rem;">Resource-Level Interactions</h3>
                ${Object.entries(resourceInteractions).map(([interaction, resources]) => `
                    <div style="margin: 1rem 0;">
                        <strong>${interaction}:</strong> ${resources.join(', ')}
                    </div>
                `).join('')}
            `;
        }

        interactionsTab.innerHTML = interactionsHtml;
    }

    renderOperations() {
        const operationsTab = document.getElementById('operations-tab');
        const rest = this.capabilityData.rest?.[0];
        
        if (!rest?.operation && !rest?.resource?.some(r => r.operation)) {
            operationsTab.innerHTML = '<p>No operations found in this CapabilityStatement.</p>';
            return;
        }

        let operationsHtml = '';

        // System-level operations
        if (rest.operation?.length > 0) {
            operationsHtml += `
                <h3>System-Level Operations</h3>
                <div class="resource-grid">
                    ${rest.operation.map(op => `
                        <div class="resource-card">
                            <div class="resource-header">
                                <h3>$${op.name}</h3>
                            </div>
                            <div class="resource-content active">
                                <div><strong>Definition:</strong> ${op.definition}</div>
                                ${op.documentation ? `<div><strong>Documentation:</strong> ${op.documentation}</div>` : ''}
                            </div>
                        </div>
                    `).join('')}
                </div>
            `;
        }

        // Resource-level operations
        const resourceOps = rest.resource?.filter(r => r.operation?.length > 0) || [];
        if (resourceOps.length > 0) {
            operationsHtml += `
                <h3>Resource-Level Operations</h3>
                <div class="resource-grid">
                    ${resourceOps.map(resource => `
                        <div class="resource-card">
                            <div class="resource-header" onclick="this.parentElement.querySelector('.resource-content').classList.toggle('active'); this.querySelector('.toggle').textContent = this.querySelector('.toggle').textContent === '+' ? '−' : '+';">
                                <h3>${resource.type} Operations</h3>
                                <span class="toggle">+</span>
                            </div>
                            <div class="resource-content">
                                ${resource.operation.map(op => `
                                    <div style="margin: 1rem 0; padding: 1rem; background: #f8f9fa; border-radius: 8px;">
                                        <strong>$${op.name}</strong><br>
                                        <div><strong>Definition:</strong> ${op.definition}</div>
                                        ${op.documentation ? `<div><strong>Documentation:</strong> ${op.documentation}</div>` : ''}
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                    `).join('')}
                </div>
            `;
        }

        operationsTab.innerHTML = operationsHtml || '<p>No operations found.</p>';
    }

    renderSearchParameters() {
        const searchTab = document.getElementById('search-tab');
        const resources = this.capabilityData.rest?.[0]?.resource || [];
        
        const resourcesWithSearch = resources.filter(r => r.searchParam?.length > 0);
        
        if (resourcesWithSearch.length === 0) {
            searchTab.innerHTML = '<p>No search parameters found in this CapabilityStatement.</p>';
            return;
        }

        const searchHtml = resourcesWithSearch.map(resource => `
            <div class="resource-card">
                <div class="resource-header" onclick="this.parentElement.querySelector('.resource-content').classList.toggle('active'); this.querySelector('.toggle').textContent = this.querySelector('.toggle').textContent === '+' ? '−' : '+';">
                    <h3>${resource.type} (${resource.searchParam.length} parameters)</h3>
                    <span class="toggle">+</span>
                </div>
                <div class="resource-content">
                    <div class="search-params">
                        ${resource.searchParam.map(param => `
                            <div class="search-param">
                                <strong>${param.name}</strong> 
                                <span style="color: #666;">(${param.type})</span>
                                ${param.documentation ? `<br><small>${param.documentation}</small>` : ''}
                                ${param.definition ? `<br><small>Definition: ${param.definition}</small>` : ''}
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>
        `).join('');

        searchTab.innerHTML = `
            <h3>Search Parameters by Resource</h3>
            <div class="resource-grid">
                ${searchHtml}
            </div>
        `;
    }

    renderSecurity() {
        const securityTab = document.getElementById('security-tab');
        const rest = this.capabilityData.rest?.[0];
        
        if (!rest?.security) {
            securityTab.innerHTML = '<p>No security information found in this CapabilityStatement.</p>';
            return;
        }

        const security = rest.security;
        let securityHtml = '';

        if (security.cors !== undefined) {
            securityHtml += `<div><strong>CORS:</strong> ${security.cors}</div>`;
        }

        if (security.service?.length > 0) {
            securityHtml += `
                <div style="margin-top: 1rem;">
                    <strong>Security Services:</strong>
                    <div class="interaction-list">
                        ${security.service.map(service => 
                            `<span class="interaction-tag">${service.coding?.[0]?.display || service.text || 'Unknown'}</span>`
                        ).join('')}
                    </div>
                </div>
            `;
        }

        if (security.description) {
            securityHtml += `<div style="margin-top: 1rem;"><strong>Description:</strong> ${security.description}</div>`;
        }

        securityTab.innerHTML = securityHtml || '<p>No detailed security information available.</p>';
    }

    renderRawData() {
        const rawTab = document.getElementById('raw-tab');
        rawTab.innerHTML = `
            <h3>Raw CapabilityStatement JSON</h3>
            <div class="json-container">
                <pre>${JSON.stringify(this.capabilityData, null, 2)}</pre>
            </div>
        `;
    }

    switchTab(tabName) {
        // Update tab buttons
        document.querySelectorAll('.tab-button').forEach(button => {
            button.classList.remove('active');
        });
        document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');

        // Update tab panels
        document.querySelectorAll('.tab-panel').forEach(panel => {
            panel.classList.remove('active');
        });
        document.getElementById(`${tabName}-tab`).classList.add('active');
    }

    loadDemoData() {
        // Load from the sandbox FHIR server
        const sandboxUrl = 'https://fhirr4sandbox.webch.art/webchart.cgi/fhir/metadata';
        
        // Set the URL in the input field
        document.getElementById('fhir-url').value = sandboxUrl;
        
        // Load the CapabilityStatement from the sandbox
        this.loadCapabilityStatement();
    }

    loadStaticDemoData() {
        // Fallback static demo data if needed
        const demoData = {
            "resourceType": "CapabilityStatement",
            "id": "demo",
            "url": "https://fhirr4sandbox.webch.art/webchart.cgi/fhir/metadata",
            "version": "4.0.1",
            "name": "Sandbox_FHIR_Capability_Statement",
            "status": "active",
            "experimental": false,
            "date": "2025-10-15T20:10:00Z",
            "publisher": "WebChart FHIR R4 Sandbox",
            "contact": [{
                "name": "FHIR Support Team",
                "telecom": [{
                    "system": "url",
                    "value": "https://www.webchartnow.com/support"
                }, {
                    "system": "email",
                    "value": "fhir-support@webchartnow.com"
                }]
            }],
            "description": "This is a demonstration CapabilityStatement from the WebChart FHIR R4 Sandbox showing typical FHIR server capabilities.",
            "kind": "instance",
            "software": {
                "name": "WebChart FHIR R4 Sandbox",
                "version": "1.0.0"
            },
            "fhirVersion": "4.0.1",
            "format": ["application/fhir+json", "application/fhir+xml"],
            "rest": [{
                "mode": "server",
                "documentation": "Demo FHIR server with common resource support",
                "security": {
                    "cors": true,
                    "service": [{
                        "coding": [{
                            "system": "http://terminology.hl7.org/CodeSystem/restful-security-service",
                            "code": "SMART-on-FHIR",
                            "display": "SMART-on-FHIR"
                        }],
                        "text": "SMART-on-FHIR OAuth2"
                    }],
                    "description": "OAuth2 using SMART-on-FHIR profile"
                },
                "interaction": [
                    {"code": "transaction"},
                    {"code": "batch"},
                    {"code": "search-system"},
                    {"code": "history-system"}
                ],
                "resource": [
                    {
                        "type": "Patient",
                        "profile": "http://hl7.org/fhir/StructureDefinition/Patient",
                        "supportedProfile": [
                            "http://hl7.org/fhir/us/core/StructureDefinition/us-core-patient"
                        ],
                        "interaction": [
                            {"code": "read", "documentation": "Read patient by ID"},
                            {"code": "search-type", "documentation": "Search for patients"},
                            {"code": "create", "documentation": "Create new patient"},
                            {"code": "update", "documentation": "Update existing patient"}
                        ],
                        "versioning": "versioned",
                        "readHistory": true,
                        "updateCreate": true,
                        "conditionalCreate": true,
                        "conditionalRead": "full-support",
                        "conditionalUpdate": true,
                        "conditionalDelete": "single",
                        "referencePolicy": ["literal", "logical"],
                        "searchParam": [
                            {
                                "name": "_id",
                                "definition": "http://hl7.org/fhir/SearchParameter/Resource-id",
                                "type": "token",
                                "documentation": "Logical id of this artifact"
                            },
                            {
                                "name": "identifier",
                                "definition": "http://hl7.org/fhir/SearchParameter/Patient-identifier",
                                "type": "token",
                                "documentation": "A patient identifier"
                            },
                            {
                                "name": "name",
                                "definition": "http://hl7.org/fhir/SearchParameter/Patient-name",
                                "type": "string",
                                "documentation": "A portion of the patient's name"
                            },
                            {
                                "name": "family",
                                "definition": "http://hl7.org/fhir/SearchParameter/individual-family",
                                "type": "string",
                                "documentation": "A portion of the family name"
                            },
                            {
                                "name": "given",
                                "definition": "http://hl7.org/fhir/SearchParameter/individual-given",
                                "type": "string",
                                "documentation": "A portion of the given name"
                            },
                            {
                                "name": "birthdate",
                                "definition": "http://hl7.org/fhir/SearchParameter/individual-birthdate",
                                "type": "date",
                                "documentation": "The patient's date of birth"
                            },
                            {
                                "name": "gender",
                                "definition": "http://hl7.org/fhir/SearchParameter/individual-gender",
                                "type": "token",
                                "documentation": "Gender of the patient"
                            }
                        ]
                    },
                    {
                        "type": "Observation",
                        "profile": "http://hl7.org/fhir/StructureDefinition/Observation",
                        "supportedProfile": [
                            "http://hl7.org/fhir/us/core/StructureDefinition/us-core-observation-lab"
                        ],
                        "interaction": [
                            {"code": "read", "documentation": "Read observation by ID"},
                            {"code": "search-type", "documentation": "Search for observations"}
                        ],
                        "referencePolicy": ["literal"],
                        "searchParam": [
                            {
                                "name": "_id",
                                "definition": "http://hl7.org/fhir/SearchParameter/Resource-id",
                                "type": "token",
                                "documentation": "Logical id of this artifact"
                            },
                            {
                                "name": "patient",
                                "definition": "http://hl7.org/fhir/SearchParameter/clinical-patient",
                                "type": "reference",
                                "documentation": "The patient this observation is about"
                            },
                            {
                                "name": "code",
                                "definition": "http://hl7.org/fhir/SearchParameter/clinical-code",
                                "type": "token",
                                "documentation": "The code of the observation type"
                            },
                            {
                                "name": "date",
                                "definition": "http://hl7.org/fhir/SearchParameter/clinical-date",
                                "type": "date",
                                "documentation": "Obtained date/time"
                            },
                            {
                                "name": "category",
                                "definition": "http://hl7.org/fhir/SearchParameter/Observation-category",
                                "type": "token",
                                "documentation": "The classification of the type of observation"
                            }
                        ]
                    },
                    {
                        "type": "Condition",
                        "profile": "http://hl7.org/fhir/StructureDefinition/Condition",
                        "interaction": [
                            {"code": "read", "documentation": "Read condition by ID"},
                            {"code": "search-type", "documentation": "Search for conditions"}
                        ],
                        "referencePolicy": ["literal"],
                        "searchParam": [
                            {
                                "name": "_id",
                                "definition": "http://hl7.org/fhir/SearchParameter/Resource-id",
                                "type": "token",
                                "documentation": "Logical id of this artifact"
                            },
                            {
                                "name": "patient",
                                "definition": "http://hl7.org/fhir/SearchParameter/clinical-patient",
                                "type": "reference",
                                "documentation": "Who has the condition?"
                            },
                            {
                                "name": "code",
                                "definition": "http://hl7.org/fhir/SearchParameter/clinical-code",
                                "type": "token",
                                "documentation": "Code for the condition"
                            }
                        ]
                    }
                ],
                "operation": [
                    {
                        "name": "validate",
                        "definition": "http://hl7.org/fhir/OperationDefinition/Resource-validate",
                        "documentation": "Validate a resource"
                    }
                ]
            }]
        };

        this.hideError();
        this.hideLoading();
        
        // Set demo data and display
        this.capabilityData = demoData;
        this.displayCapabilityStatement();
    }

    checkUrlParameters() {
        // Check if there's a 'url' parameter in the current page URL
        const urlParams = new URLSearchParams(window.location.search);
        const fhirUrl = urlParams.get('url');
        
        if (fhirUrl) {
            // Decode the URL and set it in the input field
            const decodedUrl = decodeURIComponent(fhirUrl);
            document.getElementById('fhir-url').value = decodedUrl;
            
            // Automatically load the CapabilityStatement
            this.loadCapabilityStatement();
        }
    }

    generatePermalink() {
        const currentUrl = document.getElementById('fhir-url').value.trim();
        
        if (!currentUrl) {
            alert('No FHIR URL is currently loaded. Please load a CapabilityStatement first.');
            return;
        }

        // Create a permalink with the current FHIR URL as a parameter
        const baseUrl = window.location.origin + window.location.pathname;
        const permalink = `${baseUrl}?url=${encodeURIComponent(currentUrl)}`;
        
        // Copy to clipboard
        navigator.clipboard.writeText(permalink).then(() => {
            // Show temporary feedback
            const button = document.getElementById('permalink-link');
            const originalText = button.textContent;
            button.textContent = '✅ Link Copied!';
            button.style.background = 'linear-gradient(135deg, #28a745 0%, #20c997 100%)';
            
            setTimeout(() => {
                button.textContent = originalText;
                button.style.background = 'linear-gradient(135deg, #6c757d 0%, #495057 100%)';
            }, 2000);
        }).catch(() => {
            // Fallback: show the URL in an alert if clipboard access fails
            alert(`Permalink copied to clipboard:\n\n${permalink}`);
        });
    }
}

// Initialize the application when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new FHIRCapabilityViewer();
});