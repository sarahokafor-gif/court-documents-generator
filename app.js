/**
 * Court Documents Generator - Main Application
 * Generates professional court documents in Word and PDF formats
 */

// Import docx library components
const {
    Document,
    Paragraph,
    TextRun,
    HeadingLevel,
    AlignmentType,
    BorderStyle,
    Packer,
    PageBreak,
    Table,
    TableCell,
    TableRow,
    WidthType,
    convertInchesToTwip
} = docx;

// Application State
const AppState = {
    currentStep: 1,
    documentType: null,
    caseDetails: {},
    documentContent: {},

    // Reset state
    reset() {
        this.currentStep = 1;
        this.documentType = null;
        this.caseDetails = {};
        this.documentContent = {};
    }
};

// Step Navigation
function goToStep(step) {
    document.querySelectorAll('.step').forEach(s => s.classList.remove('active'));
    document.getElementById(`step${step}`).classList.add('active');
    AppState.currentStep = step;

    if (step === 3) {
        showDocumentForm();
    }

    if (step === 4) {
        renderPreview();
        setDefaultDate();
    }
}

// Document Type Selection
document.addEventListener('DOMContentLoaded', () => {
    const docTypeCards = document.querySelectorAll('.doc-type-card');

    docTypeCards.forEach(card => {
        card.addEventListener('click', () => {
            docTypeCards.forEach(c => c.classList.remove('selected'));
            card.classList.add('selected');
            AppState.documentType = card.dataset.type;

            // Auto-advance to step 2
            setTimeout(() => goToStep(2), 300);
        });
    });

    // Navigation buttons
    document.getElementById('backToStep1')?.addEventListener('click', () => goToStep(1));
    document.getElementById('toStep3')?.addEventListener('click', () => {
        if (collectCaseDetails()) {
            goToStep(3);
        }
    });
    document.getElementById('backToStep2')?.addEventListener('click', () => goToStep(2));
    document.getElementById('toStep4')?.addEventListener('click', () => {
        if (collectDocumentContent()) {
            goToStep(4);
        }
    });
    document.getElementById('backToStep3')?.addEventListener('click', () => goToStep(3));
    document.getElementById('editDocument')?.addEventListener('click', () => goToStep(3));
    document.getElementById('startOver')?.addEventListener('click', () => {
        AppState.reset();
        clearAllForms();
        goToStep(1);
    });

    // Download buttons
    document.getElementById('downloadWord')?.addEventListener('click', downloadWord);
    document.getElementById('downloadPDF')?.addEventListener('click', downloadPDF);
});

// Collect case details from form
function collectCaseDetails() {
    const required = ['courtName', 'caseNumber'];
    for (const field of required) {
        const el = document.getElementById(field);
        if (!el.value.trim()) {
            showToast('Please fill in all required fields', 'error');
            el.focus();
            return false;
        }
    }

    AppState.caseDetails = {
        court: document.getElementById('courtName').value,
        caseNumber: document.getElementById('caseNumber').value.trim(),
        matterOf: document.getElementById('matterOf').value.trim(),
        inMatterPerson: document.getElementById('inMatterPerson').value.trim(),
        party1Name: document.getElementById('party1Name').value.trim(),
        party1Role: document.getElementById('party1Role').value,
        party2Name: document.getElementById('party2Name').value.trim(),
        party2Role: document.getElementById('party2Role').value
    };

    return true;
}

// Show the appropriate document form
function showDocumentForm() {
    // Hide all forms
    document.querySelectorAll('.document-form').forEach(f => f.classList.add('hidden'));

    // Show the selected form
    const formId = {
        'witness-statement': 'witnessStatementForm',
        'skeleton-argument': 'skeletonArgumentForm',
        'position-statement': 'positionStatementForm',
        'draft-order': 'draftOrderForm'
    }[AppState.documentType];

    if (formId) {
        document.getElementById(formId).classList.remove('hidden');
    }

    // Update step title
    const titles = {
        'witness-statement': 'Witness Statement Details',
        'skeleton-argument': 'Skeleton Argument Details',
        'position-statement': 'Position Statement Details',
        'draft-order': 'Draft Order Details'
    };
    document.getElementById('step3Title').textContent = titles[AppState.documentType] || 'Document Content';
}

// Collect document content from forms
function collectDocumentContent() {
    switch (AppState.documentType) {
        case 'witness-statement':
            AppState.documentContent = {
                witnessName: document.getElementById('witnessName').value.trim(),
                witnessRole: document.getElementById('witnessRole').value.trim(),
                witnessAddress: document.getElementById('witnessAddress').value.trim(),
                statementNumber: document.getElementById('statementNumber').value,
                exhibitMark: document.getElementById('exhibitMark').value.trim(),
                introduction: document.getElementById('wsIntro').value.trim(),
                body: document.getElementById('wsBody').value.trim()
            };
            break;

        case 'skeleton-argument':
            AppState.documentContent = {
                hearingDate: document.getElementById('hearingDate').value,
                hearingType: document.getElementById('hearingType').value.trim(),
                timeEstimate: document.getElementById('timeEstimate').value.trim(),
                introduction: document.getElementById('skIntro').value.trim(),
                issues: document.getElementById('skIssues').value.trim(),
                law: document.getElementById('skLaw').value.trim(),
                application: document.getElementById('skApplication').value.trim(),
                relief: document.getElementById('skRelief').value.trim(),
                authorities: document.getElementById('skAuthorities').value.trim()
            };
            break;

        case 'position-statement':
            AppState.documentContent = {
                hearingDate: document.getElementById('psHearingDate').value,
                onBehalfOf: document.getElementById('psOnBehalfOf').value.trim(),
                introduction: document.getElementById('psIntro').value.trim(),
                currentPosition: document.getElementById('psCurrentPosition').value.trim(),
                ordersSought: document.getElementById('psOrders').value.trim(),
                outstanding: document.getElementById('psOutstanding').value.trim()
            };
            break;

        case 'draft-order':
            AppState.documentContent = {
                orderType: document.getElementById('orderType').value,
                judgeName: document.getElementById('judgeName').value.trim(),
                recitals: document.getElementById('recitals').value.trim(),
                provisions: document.getElementById('orderProvisions').value.trim(),
                serviceProvisions: document.getElementById('serviceProvisions').value.trim(),
                costsProvisions: document.getElementById('costsProvisions').value.trim()
            };
            break;
    }

    return true;
}

// Set default date
function setDefaultDate() {
    const dateInput = document.getElementById('documentDate');
    if (dateInput && !dateInput.value) {
        dateInput.value = new Date().toISOString().split('T')[0];
    }
}

// Render preview
function renderPreview() {
    const preview = document.getElementById('previewContent');
    const cd = AppState.caseDetails;
    const dc = AppState.documentContent;

    let html = `
        <div class="doc-header">
            <div class="case-no">Case No: ${escapeHtml(cd.caseNumber)}</div>
            <div class="court">${escapeHtml(cd.court).replace(/\n/g, '<br>')}</div>
    `;

    if (cd.matterOf) {
        html += `<div class="matter">IN THE MATTER OF ${escapeHtml(cd.matterOf)}</div>`;
    }

    if (cd.inMatterPerson) {
        html += `<div class="matter">IN THE MATTER OF: ${escapeHtml(cd.inMatterPerson)}</div>`;
    }

    if (cd.party1Name && cd.party2Name) {
        html += `
            <div class="between"><strong>B E T W E E N:</strong></div>
            <div class="party">${escapeHtml(cd.party1Name)}</div>
            <div class="designation">${escapeHtml(cd.party1Role)}</div>
            <div class="and">- and -</div>
            <div class="party">${escapeHtml(cd.party2Name)}</div>
            <div class="designation">${escapeHtml(cd.party2Role)}</div>
        `;
    }

    html += `<hr>`;

    // Document title
    const docTitles = {
        'witness-statement': `WITNESS STATEMENT OF ${dc.witnessName?.toUpperCase() || 'WITNESS'}`,
        'skeleton-argument': 'SKELETON ARGUMENT',
        'position-statement': `POSITION STATEMENT ON BEHALF OF THE ${cd.party1Role?.toUpperCase() || 'APPLICANT'}`,
        'draft-order': dc.orderType || 'ORDER'
    };

    html += `<div class="doc-title">${docTitles[AppState.documentType]}</div><hr></div>`;

    // Document body
    html += `<div class="doc-body">`;

    switch (AppState.documentType) {
        case 'witness-statement':
            html += renderWitnessStatementBody(dc);
            break;
        case 'skeleton-argument':
            html += renderSkeletonBody(dc);
            break;
        case 'position-statement':
            html += renderPositionStatementBody(dc);
            break;
        case 'draft-order':
            html += renderDraftOrderBody(dc);
            break;
    }

    html += `</div>`;

    preview.innerHTML = html;
}

function renderWitnessStatementBody(dc) {
    let html = '';

    if (dc.introduction) {
        html += `<p>${escapeHtml(dc.introduction)}</p>`;
    }

    if (dc.body) {
        const paragraphs = dc.body.split('\n\n');
        paragraphs.forEach(p => {
            if (p.trim()) {
                html += `<p class="numbered">${escapeHtml(p.trim())}</p>`;
            }
        });
    }

    html += `
        <p><strong>STATEMENT OF TRUTH</strong></p>
        <p>I believe that the facts stated in this witness statement are true. I understand that proceedings for contempt of court may be brought against anyone who makes, or causes to be made, a false statement in a document verified by a statement of truth without an honest belief in its truth.</p>
    `;

    return html;
}

function renderSkeletonBody(dc) {
    let html = '';

    if (dc.introduction) {
        html += `<p><strong>Introduction</strong></p><p>${escapeHtml(dc.introduction)}</p>`;
    }

    if (dc.issues) {
        html += `<p><strong>Issues</strong></p><p>${escapeHtml(dc.issues).replace(/\n/g, '<br>')}</p>`;
    }

    if (dc.law) {
        html += `<p><strong>Legal Framework</strong></p><p>${escapeHtml(dc.law).replace(/\n/g, '<br>')}</p>`;
    }

    if (dc.application) {
        html += `<p><strong>Application</strong></p><p>${escapeHtml(dc.application).replace(/\n/g, '<br>')}</p>`;
    }

    if (dc.relief) {
        html += `<p><strong>Relief Sought</strong></p><p>${escapeHtml(dc.relief).replace(/\n/g, '<br>')}</p>`;
    }

    if (dc.timeEstimate) {
        html += `<p><strong>Time Estimate:</strong> ${escapeHtml(dc.timeEstimate)}</p>`;
    }

    if (dc.authorities) {
        html += `<p><strong>Authorities</strong></p><p>${escapeHtml(dc.authorities).replace(/\n/g, '<br>')}</p>`;
    }

    return html;
}

function renderPositionStatementBody(dc) {
    let html = '';

    if (dc.introduction) {
        const paragraphs = dc.introduction.split('\n\n');
        paragraphs.forEach(p => {
            if (p.trim()) {
                html += `<p class="numbered">${escapeHtml(p.trim())}</p>`;
            }
        });
    }

    if (dc.currentPosition) {
        html += `<p><strong>Current Position</strong></p>`;
        const paragraphs = dc.currentPosition.split('\n\n');
        paragraphs.forEach(p => {
            if (p.trim()) {
                html += `<p class="numbered">${escapeHtml(p.trim())}</p>`;
            }
        });
    }

    if (dc.ordersSought) {
        html += `<p><strong>Orders Sought</strong></p>`;
        html += `<p>${escapeHtml(dc.ordersSought).replace(/\n/g, '<br>')}</p>`;
    }

    if (dc.outstanding) {
        html += `<p><strong>Outstanding Issues</strong></p>`;
        html += `<p>${escapeHtml(dc.outstanding).replace(/\n/g, '<br>')}</p>`;
    }

    return html;
}

function renderDraftOrderBody(dc) {
    let html = '';

    if (dc.recitals) {
        const recitals = dc.recitals.split('\n');
        recitals.forEach(r => {
            if (r.trim()) {
                html += `<p>${escapeHtml(r.trim())}</p>`;
            }
        });
    }

    if (dc.provisions) {
        html += `<p><strong>IT IS ORDERED THAT:</strong></p>`;
        const provisions = dc.provisions.split('\n\n');
        provisions.forEach(p => {
            if (p.trim()) {
                html += `<p class="numbered">${escapeHtml(p.trim())}</p>`;
            }
        });
    }

    if (dc.serviceProvisions) {
        html += `<p>${escapeHtml(dc.serviceProvisions)}</p>`;
    }

    if (dc.costsProvisions) {
        html += `<p>${escapeHtml(dc.costsProvisions)}</p>`;
    }

    return html;
}

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Generate Word Document
async function downloadWord() {
    const btn = document.getElementById('downloadWord');
    btn.disabled = true;
    btn.innerHTML = '<span class="loading">Generating</span>';

    try {
        const doc = createWordDocument();
        const blob = await Packer.toBlob(doc);
        saveAs(blob, generateFilename('docx'));
        showToast('Word document downloaded successfully!', 'success');
    } catch (error) {
        console.error('Error generating Word document:', error);
        showToast('Error generating document. Please try again.', 'error');
    }

    btn.disabled = false;
    btn.innerHTML = `
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
            <polyline points="14 2 14 8 20 8"></polyline>
            <line x1="16" y1="13" x2="8" y2="13"></line>
            <line x1="16" y1="17" x2="8" y2="17"></line>
        </svg>
        Download Word (.docx)
    `;
}

function createWordDocument() {
    const cd = AppState.caseDetails;
    const dc = AppState.documentContent;
    const preparedBy = document.getElementById('preparedBy').value || 'Sarah Okafor, Barrister';
    const docDate = formatDate(document.getElementById('documentDate').value);

    const children = [];

    // Case Number (right aligned)
    children.push(new Paragraph({
        children: [new TextRun({ text: `Case No: ${cd.caseNumber}`, font: 'Century Gothic', size: 24 })],
        alignment: AlignmentType.RIGHT,
        spacing: { after: 200 }
    }));

    // Court Name (left aligned)
    const courtLines = cd.court.split('\n');
    courtLines.forEach(line => {
        children.push(new Paragraph({
            children: [new TextRun({ text: line, font: 'Century Gothic', size: 24, bold: true })],
            alignment: AlignmentType.LEFT
        }));
    });

    // In the Matter Of (statute)
    if (cd.matterOf) {
        children.push(new Paragraph({
            children: [new TextRun({ text: `IN THE MATTER OF ${cd.matterOf}`, font: 'Century Gothic', size: 24 })],
            alignment: AlignmentType.LEFT,
            spacing: { before: 200 }
        }));
    }

    // In the Matter Of (person/property)
    if (cd.inMatterPerson) {
        children.push(new Paragraph({
            children: [new TextRun({ text: 'IN THE MATTER OF:', font: 'Century Gothic', size: 24 })],
            alignment: AlignmentType.LEFT,
            spacing: { before: 200 }
        }));
        children.push(new Paragraph({
            children: [new TextRun({ text: cd.inMatterPerson, font: 'Century Gothic', size: 24 })],
            alignment: AlignmentType.CENTER
        }));
    }

    // Parties
    if (cd.party1Name && cd.party2Name) {
        children.push(new Paragraph({
            children: [new TextRun({ text: 'B E T W E E N:', font: 'Century Gothic', size: 24, bold: true })],
            alignment: AlignmentType.LEFT,
            spacing: { before: 400 }
        }));

        children.push(new Paragraph({
            children: [new TextRun({ text: cd.party1Name, font: 'Century Gothic', size: 24 })],
            alignment: AlignmentType.CENTER,
            spacing: { before: 200 }
        }));

        children.push(new Paragraph({
            children: [new TextRun({ text: cd.party1Role, font: 'Century Gothic', size: 24, italics: true })],
            alignment: AlignmentType.RIGHT
        }));

        children.push(new Paragraph({
            children: [new TextRun({ text: '- and -', font: 'Century Gothic', size: 24 })],
            alignment: AlignmentType.CENTER,
            spacing: { before: 200 }
        }));

        children.push(new Paragraph({
            children: [new TextRun({ text: cd.party2Name, font: 'Century Gothic', size: 24 })],
            alignment: AlignmentType.CENTER,
            spacing: { before: 200 }
        }));

        children.push(new Paragraph({
            children: [new TextRun({ text: cd.party2Role, font: 'Century Gothic', size: 24, italics: true })],
            alignment: AlignmentType.RIGHT
        }));
    }

    // Horizontal line
    children.push(createHorizontalLine());

    // Document title
    const docTitles = {
        'witness-statement': `WITNESS STATEMENT OF ${dc.witnessName?.toUpperCase() || 'WITNESS'}`,
        'skeleton-argument': 'SKELETON ARGUMENT',
        'position-statement': `POSITION STATEMENT ON BEHALF OF THE ${cd.party1Role?.toUpperCase() || 'APPLICANT'}`,
        'draft-order': dc.orderType || 'ORDER'
    };

    children.push(new Paragraph({
        children: [new TextRun({ text: docTitles[AppState.documentType], font: 'Century Gothic', size: 24, bold: true })],
        alignment: AlignmentType.CENTER,
        spacing: { before: 200, after: 200 }
    }));

    // Horizontal line
    children.push(createHorizontalLine());

    // Document body
    switch (AppState.documentType) {
        case 'witness-statement':
            addWitnessStatementContent(children, dc);
            break;
        case 'skeleton-argument':
            addSkeletonContent(children, dc);
            break;
        case 'position-statement':
            addPositionStatementContent(children, dc);
            break;
        case 'draft-order':
            addDraftOrderContent(children, dc);
            break;
    }

    // Signature block
    children.push(new Paragraph({ spacing: { before: 600 } }));
    children.push(new Paragraph({
        children: [new TextRun({ text: `Prepared by: ${preparedBy}`, font: 'Century Gothic', size: 24, bold: true })],
        alignment: AlignmentType.RIGHT
    }));
    children.push(new Paragraph({
        children: [new TextRun({ text: docDate, font: 'Century Gothic', size: 24 })],
        alignment: AlignmentType.RIGHT
    }));

    return new Document({
        sections: [{
            properties: {
                page: {
                    margin: {
                        top: convertInchesToTwip(1),
                        right: convertInchesToTwip(1),
                        bottom: convertInchesToTwip(1),
                        left: convertInchesToTwip(1)
                    }
                }
            },
            children: children
        }]
    });
}

function createHorizontalLine() {
    return new Paragraph({
        border: {
            bottom: {
                color: '000000',
                space: 1,
                style: BorderStyle.SINGLE,
                size: 12
            }
        },
        spacing: { after: 200 }
    });
}

function addWitnessStatementContent(children, dc) {
    // Statement details
    if (dc.statementNumber) {
        children.push(new Paragraph({
            children: [
                new TextRun({ text: `${dc.statementNumber} witness statement of `, font: 'Century Gothic', size: 24 }),
                new TextRun({ text: dc.witnessName, font: 'Century Gothic', size: 24, bold: true })
            ],
            spacing: { before: 400, after: 200 }
        }));
    }

    if (dc.exhibitMark) {
        children.push(new Paragraph({
            children: [new TextRun({ text: `Exhibit: ${dc.exhibitMark}`, font: 'Century Gothic', size: 24 })],
            spacing: { after: 200 }
        }));
    }

    // Introduction
    if (dc.introduction) {
        children.push(new Paragraph({
            children: [new TextRun({ text: dc.introduction, font: 'Century Gothic', size: 24 })],
            spacing: { before: 400, after: 200 }
        }));
    }

    // Body paragraphs
    if (dc.body) {
        const paragraphs = dc.body.split('\n\n');
        paragraphs.forEach(p => {
            if (p.trim()) {
                children.push(new Paragraph({
                    children: [new TextRun({ text: p.trim(), font: 'Century Gothic', size: 24 })],
                    indent: { left: 720, hanging: 720 },
                    spacing: { after: 200, line: 360 }
                }));
            }
        });
    }

    // Statement of Truth
    children.push(new Paragraph({
        children: [new TextRun({ text: 'STATEMENT OF TRUTH', font: 'Century Gothic', size: 24, bold: true })],
        spacing: { before: 400, after: 200 }
    }));

    children.push(new Paragraph({
        children: [new TextRun({
            text: 'I believe that the facts stated in this witness statement are true. I understand that proceedings for contempt of court may be brought against anyone who makes, or causes to be made, a false statement in a document verified by a statement of truth without an honest belief in its truth.',
            font: 'Century Gothic',
            size: 24
        })],
        spacing: { after: 400 }
    }));

    children.push(new Paragraph({
        children: [new TextRun({ text: 'Signed: ____________________________', font: 'Century Gothic', size: 24 })],
        spacing: { after: 200 }
    }));

    children.push(new Paragraph({
        children: [new TextRun({ text: `Name: ${dc.witnessName || ''}`, font: 'Century Gothic', size: 24 })],
        spacing: { after: 200 }
    }));

    children.push(new Paragraph({
        children: [new TextRun({ text: 'Date: ____________________________', font: 'Century Gothic', size: 24 })]
    }));
}

function addSkeletonContent(children, dc) {
    const sections = [
        { title: 'Introduction', content: dc.introduction },
        { title: 'Issues', content: dc.issues },
        { title: 'Legal Framework', content: dc.law },
        { title: 'Application of Law to Facts', content: dc.application },
        { title: 'Relief Sought', content: dc.relief }
    ];

    sections.forEach(section => {
        if (section.content) {
            children.push(new Paragraph({
                children: [new TextRun({ text: section.title, font: 'Century Gothic', size: 24, bold: true, underline: {} })],
                spacing: { before: 400, after: 200 }
            }));

            const paragraphs = section.content.split('\n\n');
            paragraphs.forEach(p => {
                if (p.trim()) {
                    children.push(new Paragraph({
                        children: [new TextRun({ text: p.trim(), font: 'Century Gothic', size: 24 })],
                        spacing: { after: 200, line: 360 }
                    }));
                }
            });
        }
    });

    if (dc.timeEstimate) {
        children.push(new Paragraph({
            children: [
                new TextRun({ text: 'Time Estimate: ', font: 'Century Gothic', size: 24, bold: true }),
                new TextRun({ text: dc.timeEstimate, font: 'Century Gothic', size: 24 })
            ],
            spacing: { before: 400, after: 200 }
        }));
    }

    if (dc.authorities) {
        children.push(new Paragraph({
            children: [new TextRun({ text: 'Authorities', font: 'Century Gothic', size: 24, bold: true, underline: {} })],
            spacing: { before: 400, after: 200 }
        }));

        const auths = dc.authorities.split('\n');
        auths.forEach(a => {
            if (a.trim()) {
                children.push(new Paragraph({
                    children: [new TextRun({ text: a.trim(), font: 'Century Gothic', size: 24 })],
                    spacing: { after: 120 }
                }));
            }
        });
    }
}

function addPositionStatementContent(children, dc) {
    if (dc.introduction) {
        const paragraphs = dc.introduction.split('\n\n');
        paragraphs.forEach(p => {
            if (p.trim()) {
                children.push(new Paragraph({
                    children: [new TextRun({ text: p.trim(), font: 'Century Gothic', size: 24 })],
                    indent: { left: 720, hanging: 720 },
                    spacing: { after: 200, line: 360 }
                }));
            }
        });
    }

    if (dc.currentPosition) {
        children.push(new Paragraph({
            children: [new TextRun({ text: 'Current Position', font: 'Century Gothic', size: 24, bold: true, underline: {} })],
            spacing: { before: 400, after: 200 }
        }));

        const paragraphs = dc.currentPosition.split('\n\n');
        paragraphs.forEach(p => {
            if (p.trim()) {
                children.push(new Paragraph({
                    children: [new TextRun({ text: p.trim(), font: 'Century Gothic', size: 24 })],
                    indent: { left: 720, hanging: 720 },
                    spacing: { after: 200, line: 360 }
                }));
            }
        });
    }

    if (dc.ordersSought) {
        children.push(new Paragraph({
            children: [new TextRun({ text: 'Orders Sought', font: 'Century Gothic', size: 24, bold: true, underline: {} })],
            spacing: { before: 400, after: 200 }
        }));

        const paragraphs = dc.ordersSought.split('\n');
        paragraphs.forEach(p => {
            if (p.trim()) {
                children.push(new Paragraph({
                    children: [new TextRun({ text: p.trim(), font: 'Century Gothic', size: 24 })],
                    spacing: { after: 120, line: 360 }
                }));
            }
        });
    }

    if (dc.outstanding) {
        children.push(new Paragraph({
            children: [new TextRun({ text: 'Outstanding Issues', font: 'Century Gothic', size: 24, bold: true, underline: {} })],
            spacing: { before: 400, after: 200 }
        }));

        children.push(new Paragraph({
            children: [new TextRun({ text: dc.outstanding, font: 'Century Gothic', size: 24 })],
            spacing: { after: 200, line: 360 }
        }));
    }
}

function addDraftOrderContent(children, dc) {
    // Recitals
    if (dc.recitals) {
        const recitals = dc.recitals.split('\n');
        recitals.forEach(r => {
            if (r.trim()) {
                children.push(new Paragraph({
                    children: [new TextRun({ text: r.trim(), font: 'Century Gothic', size: 24 })],
                    spacing: { after: 200, line: 360 }
                }));
            }
        });
    }

    // IT IS ORDERED THAT
    children.push(new Paragraph({
        children: [new TextRun({ text: 'IT IS ORDERED THAT:', font: 'Century Gothic', size: 24, bold: true })],
        spacing: { before: 400, after: 200 }
    }));

    // Provisions
    if (dc.provisions) {
        const provisions = dc.provisions.split('\n\n');
        provisions.forEach(p => {
            if (p.trim()) {
                children.push(new Paragraph({
                    children: [new TextRun({ text: p.trim(), font: 'Century Gothic', size: 24 })],
                    indent: { left: 720, hanging: 720 },
                    spacing: { after: 200, line: 360 }
                }));
            }
        });
    }

    // Service
    if (dc.serviceProvisions) {
        children.push(new Paragraph({
            children: [new TextRun({ text: dc.serviceProvisions, font: 'Century Gothic', size: 24 })],
            spacing: { before: 200, after: 200, line: 360 }
        }));
    }

    // Costs
    if (dc.costsProvisions) {
        children.push(new Paragraph({
            children: [new TextRun({ text: dc.costsProvisions, font: 'Century Gothic', size: 24 })],
            spacing: { after: 200, line: 360 }
        }));
    }
}

// Generate PDF Document
async function downloadPDF() {
    const btn = document.getElementById('downloadPDF');
    btn.disabled = true;
    btn.innerHTML = '<span class="loading">Generating</span>';

    try {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF({
            orientation: 'portrait',
            unit: 'mm',
            format: 'a4'
        });

        const cd = AppState.caseDetails;
        const dc = AppState.documentContent;
        const preparedBy = document.getElementById('preparedBy').value || 'Sarah Okafor, Barrister';
        const docDate = formatDate(document.getElementById('documentDate').value);

        const pageWidth = doc.internal.pageSize.getWidth();
        const margin = 25;
        const maxWidth = pageWidth - (margin * 2);
        let y = margin;

        // Helper functions
        function addText(text, x, options = {}) {
            const fontSize = options.fontSize || 12;
            const fontStyle = options.bold ? 'bold' : 'normal';

            doc.setFontSize(fontSize);
            doc.setFont('times', fontStyle);

            if (options.align === 'center') {
                doc.text(text, pageWidth / 2, y, { align: 'center' });
            } else if (options.align === 'right') {
                doc.text(text, pageWidth - margin, y, { align: 'right' });
            } else {
                doc.text(text, x, y);
            }

            y += options.lineHeight || 6;
        }

        function addWrappedText(text, x, options = {}) {
            const fontSize = options.fontSize || 12;
            const fontStyle = options.bold ? 'bold' : 'normal';
            const lineHeight = options.lineHeight || 6;

            doc.setFontSize(fontSize);
            doc.setFont('times', fontStyle);

            const lines = doc.splitTextToSize(text, maxWidth);
            lines.forEach(line => {
                if (y > 270) {
                    doc.addPage();
                    y = margin;
                }
                doc.text(line, x, y);
                y += lineHeight;
            });
        }

        function checkPageBreak() {
            if (y > 260) {
                doc.addPage();
                y = margin;
            }
        }

        // Case Number
        addText(`Case No: ${cd.caseNumber}`, margin, { align: 'right' });
        y += 2;

        // Court Name
        const courtLines = cd.court.split('\n');
        courtLines.forEach(line => {
            addText(line, margin, { bold: true });
        });
        y += 4;

        // Matter Of
        if (cd.matterOf) {
            addText(`IN THE MATTER OF ${cd.matterOf}`, margin);
        }

        if (cd.inMatterPerson) {
            addText('IN THE MATTER OF:', margin);
            addText(cd.inMatterPerson, margin, { align: 'center' });
        }
        y += 4;

        // Parties
        if (cd.party1Name && cd.party2Name) {
            addText('B E T W E E N:', margin, { bold: true });
            y += 2;
            addText(cd.party1Name, margin, { align: 'center' });
            addText(cd.party1Role, margin, { align: 'right' });
            y += 2;
            addText('- and -', margin, { align: 'center' });
            y += 2;
            addText(cd.party2Name, margin, { align: 'center' });
            addText(cd.party2Role, margin, { align: 'right' });
        }
        y += 2;

        // Line
        doc.setLineWidth(0.5);
        doc.line(margin, y, pageWidth - margin, y);
        y += 8;

        // Document title
        const docTitles = {
            'witness-statement': `WITNESS STATEMENT OF ${dc.witnessName?.toUpperCase() || 'WITNESS'}`,
            'skeleton-argument': 'SKELETON ARGUMENT',
            'position-statement': `POSITION STATEMENT ON BEHALF OF THE ${cd.party1Role?.toUpperCase() || 'APPLICANT'}`,
            'draft-order': dc.orderType || 'ORDER'
        };

        addText(docTitles[AppState.documentType], margin, { align: 'center', bold: true });
        y += 2;

        // Line
        doc.line(margin, y, pageWidth - margin, y);
        y += 10;

        // Document body based on type
        switch (AppState.documentType) {
            case 'witness-statement':
                addPDFWitnessStatement(doc, dc, margin, maxWidth, addText, addWrappedText, checkPageBreak);
                break;
            case 'skeleton-argument':
                addPDFSkeleton(doc, dc, margin, maxWidth, addText, addWrappedText, checkPageBreak);
                break;
            case 'position-statement':
                addPDFPositionStatement(doc, dc, margin, maxWidth, addText, addWrappedText, checkPageBreak);
                break;
            case 'draft-order':
                addPDFDraftOrder(doc, dc, margin, maxWidth, addText, addWrappedText, checkPageBreak);
                break;
        }

        // Signature block
        y += 10;
        checkPageBreak();
        addText(`Prepared by: ${preparedBy}`, margin, { align: 'right', bold: true });
        addText(docDate, margin, { align: 'right' });

        doc.save(generateFilename('pdf'));
        showToast('PDF downloaded successfully!', 'success');
    } catch (error) {
        console.error('Error generating PDF:', error);
        showToast('Error generating PDF. Please try again.', 'error');
    }

    btn.disabled = false;
    btn.innerHTML = `
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
            <polyline points="14 2 14 8 20 8"></polyline>
            <path d="M12 18v-6"></path>
            <path d="M9 15l3 3 3-3"></path>
        </svg>
        Download PDF
    `;
}

function addPDFWitnessStatement(doc, dc, margin, maxWidth, addText, addWrappedText, checkPageBreak) {
    if (dc.statementNumber) {
        addWrappedText(`${dc.statementNumber} witness statement of ${dc.witnessName}`, margin, { bold: true });
    }

    if (dc.exhibitMark) {
        addWrappedText(`Exhibit: ${dc.exhibitMark}`, margin);
    }

    if (dc.introduction) {
        checkPageBreak();
        addWrappedText(dc.introduction, margin);
    }

    if (dc.body) {
        checkPageBreak();
        addWrappedText(dc.body, margin);
    }

    checkPageBreak();
    addWrappedText('STATEMENT OF TRUTH', margin, { bold: true });
    addWrappedText('I believe that the facts stated in this witness statement are true. I understand that proceedings for contempt of court may be brought against anyone who makes, or causes to be made, a false statement in a document verified by a statement of truth without an honest belief in its truth.', margin);
}

function addPDFSkeleton(doc, dc, margin, maxWidth, addText, addWrappedText, checkPageBreak) {
    const sections = [
        { title: 'Introduction', content: dc.introduction },
        { title: 'Issues', content: dc.issues },
        { title: 'Legal Framework', content: dc.law },
        { title: 'Application', content: dc.application },
        { title: 'Relief Sought', content: dc.relief }
    ];

    sections.forEach(section => {
        if (section.content) {
            checkPageBreak();
            addWrappedText(section.title, margin, { bold: true });
            addWrappedText(section.content, margin);
        }
    });

    if (dc.timeEstimate) {
        checkPageBreak();
        addWrappedText(`Time Estimate: ${dc.timeEstimate}`, margin, { bold: true });
    }

    if (dc.authorities) {
        checkPageBreak();
        addWrappedText('Authorities', margin, { bold: true });
        addWrappedText(dc.authorities, margin);
    }
}

function addPDFPositionStatement(doc, dc, margin, maxWidth, addText, addWrappedText, checkPageBreak) {
    if (dc.introduction) {
        addWrappedText(dc.introduction, margin);
    }

    if (dc.currentPosition) {
        checkPageBreak();
        addWrappedText('Current Position', margin, { bold: true });
        addWrappedText(dc.currentPosition, margin);
    }

    if (dc.ordersSought) {
        checkPageBreak();
        addWrappedText('Orders Sought', margin, { bold: true });
        addWrappedText(dc.ordersSought, margin);
    }

    if (dc.outstanding) {
        checkPageBreak();
        addWrappedText('Outstanding Issues', margin, { bold: true });
        addWrappedText(dc.outstanding, margin);
    }
}

function addPDFDraftOrder(doc, dc, margin, maxWidth, addText, addWrappedText, checkPageBreak) {
    if (dc.recitals) {
        addWrappedText(dc.recitals, margin);
    }

    checkPageBreak();
    addWrappedText('IT IS ORDERED THAT:', margin, { bold: true });

    if (dc.provisions) {
        addWrappedText(dc.provisions, margin);
    }

    if (dc.serviceProvisions) {
        checkPageBreak();
        addWrappedText(dc.serviceProvisions, margin);
    }

    if (dc.costsProvisions) {
        addWrappedText(dc.costsProvisions, margin);
    }
}

// Utility functions
function generateFilename(ext) {
    const cd = AppState.caseDetails;
    const types = {
        'witness-statement': 'Witness_Statement',
        'skeleton-argument': 'Skeleton_Argument',
        'position-statement': 'Position_Statement',
        'draft-order': 'Draft_Order'
    };

    const docType = types[AppState.documentType] || 'Document';
    const caseNum = cd.caseNumber.replace(/[^a-zA-Z0-9]/g, '_');
    const date = new Date().toISOString().split('T')[0];

    return `${docType}_${caseNum}_${date}.${ext}`;
}

function formatDate(dateStr) {
    if (!dateStr) return new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });

    const date = new Date(dateStr);
    return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
}

function clearAllForms() {
    document.querySelectorAll('input:not([type="date"]), textarea, select').forEach(el => {
        if (el.id !== 'preparedBy') {
            if (el.tagName === 'SELECT') {
                el.selectedIndex = 0;
            } else {
                el.value = '';
            }
        }
    });
    document.querySelectorAll('.doc-type-card').forEach(c => c.classList.remove('selected'));
}

function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    document.body.appendChild(toast);

    setTimeout(() => {
        toast.remove();
    }, 3000);
}
