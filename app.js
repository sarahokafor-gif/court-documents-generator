/**
 * Court Documents Generator - Main Application
 * Enhanced Witness Statement Builder with proper court document formatting
 */

// Import docx library components
const {
    Document,
    Paragraph,
    TextRun,
    AlignmentType,
    BorderStyle,
    Packer,
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
    proceedingType: 'non-adversarial', // 'non-adversarial' or 'adversarial'
    writingMode: 'structured', // 'structured' or 'free'
    parties: [],
    paragraphs: [], // Array of { id, content }
    paragraphCounter: 0,
    exhibits: [], // Array of { id, type, customType, description }
    exhibitCounter: 0,
    caseDetails: {},
    documentContent: {},

    // Reset state
    reset() {
        this.currentStep = 1;
        this.documentType = null;
        this.proceedingType = 'non-adversarial';
        this.writingMode = 'structured';
        this.parties = [];
        this.paragraphs = [];
        this.paragraphCounter = 0;
        this.exhibits = [];
        this.exhibitCounter = 0;
        this.caseDetails = {};
        this.documentContent = {};
    }
};

// ============================================
// INITIALIZATION
// ============================================

document.addEventListener('DOMContentLoaded', () => {
    initDocTypeSelection();
    initNavigation();
    initProceedingTypeToggle();
    initPartySystem();
    initWritingModeToggle();
    initParagraphSystem();
    initPhraseSuggestions();
    initExhibitSystem();
    initDownloadButtons();

    // Add initial party entries
    addPartyEntry();
    addPartyEntry();
});

// ============================================
// STEP NAVIGATION
// ============================================

function goToStep(step) {
    // Update step visibility
    document.querySelectorAll('.step').forEach(s => s.classList.remove('active'));
    const stepEl = document.getElementById(`step${step}`);
    if (stepEl) {
        stepEl.classList.add('active');
    }

    // Update progress bar
    document.querySelectorAll('.progress-step').forEach((ps, index) => {
        ps.classList.remove('active', 'completed');
        if (index + 1 < step) {
            ps.classList.add('completed');
        } else if (index + 1 === step) {
            ps.classList.add('active');
        }
    });

    AppState.currentStep = step;

    // Step-specific actions
    if (step === 3) {
        showDocumentForm();
    }
    if (step === 4) {
        renderPreview();
        setDefaultDate();
    }
}

function initNavigation() {
    // Progress bar click navigation
    document.querySelectorAll('.progress-step').forEach(step => {
        step.addEventListener('click', () => {
            const stepNum = parseInt(step.dataset.step);
            if (stepNum <= AppState.currentStep || canNavigateToStep(stepNum)) {
                goToStep(stepNum);
            }
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

    // Skeleton Argument form navigation
    document.getElementById('backToStep2Skeleton')?.addEventListener('click', () => goToStep(2));
    document.getElementById('toStep4Skeleton')?.addEventListener('click', () => {
        if (collectDocumentContent()) {
            goToStep(4);
        }
    });

    // Position Statement form navigation
    document.getElementById('backToStep2Position')?.addEventListener('click', () => goToStep(2));
    document.getElementById('toStep4Position')?.addEventListener('click', () => {
        if (collectDocumentContent()) {
            goToStep(4);
        }
    });

    // Draft Order form navigation
    document.getElementById('backToStep2Order')?.addEventListener('click', () => goToStep(2));
    document.getElementById('toStep4Order')?.addEventListener('click', () => {
        if (collectDocumentContent()) {
            goToStep(4);
        }
    });
}

function canNavigateToStep(targetStep) {
    // Allow navigation to completed steps
    if (targetStep === 1) return true;
    if (targetStep === 2) return AppState.documentType !== null;
    if (targetStep === 3) return AppState.caseDetails.caseNumber;
    if (targetStep === 4) return true;
    return false;
}

// ============================================
// DOCUMENT TYPE SELECTION
// ============================================

function initDocTypeSelection() {
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
}

// ============================================
// PROCEEDING TYPE TOGGLE
// ============================================

function initProceedingTypeToggle() {
    const toggleBtns = document.querySelectorAll('.toggle-group .toggle-btn');

    toggleBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            toggleBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            AppState.proceedingType = btn.dataset.value;
        });
    });
}

// ============================================
// PARTY SYSTEM
// ============================================

function initPartySystem() {
    document.getElementById('addPartyBtn')?.addEventListener('click', addPartyEntry);
}

function addPartyEntry() {
    const container = document.getElementById('partiesContainer');
    if (!container) return;

    const partyIndex = container.querySelectorAll('.party-entry').length;
    const designations = partyIndex === 0
        ? ['Applicant', 'Claimant', 'Petitioner', 'Appellant']
        : ['Respondent', 'Defendant', 'First Respondent', 'Second Respondent'];

    const entry = document.createElement('div');
    entry.className = 'party-entry';
    entry.innerHTML = `
        <div class="party-header">
            <span class="party-label">Party ${partyIndex + 1}</span>
            <button type="button" class="remove-party-btn" title="Remove party">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
            </button>
        </div>
        <div class="form-row">
            <div class="form-group flex-2">
                <label>Party Name</label>
                <input type="text" class="party-name" placeholder="e.g., John Smith">
            </div>
            <div class="form-group">
                <label>Designation</label>
                <select class="party-role">
                    ${designations.map(d => `<option value="${d}">${d}</option>`).join('')}
                </select>
            </div>
        </div>
        <div class="form-group">
            <label class="checkbox-label">
                <input type="checkbox" class="has-litigation-friend">
                <span>Has Litigation Friend / Accredited Legal Representative</span>
            </label>
        </div>
        <div class="litigation-friend-details hidden">
            <div class="form-row">
                <div class="form-group flex-1">
                    <label>Prefix</label>
                    <select class="lf-prefix">
                        <option value="by his litigation friend">by his litigation friend</option>
                        <option value="by her litigation friend">by her litigation friend</option>
                        <option value="by their litigation friend">by their litigation friend</option>
                        <option value="by his Accredited Legal Representative">by his Accredited Legal Representative</option>
                        <option value="by her Accredited Legal Representative">by her Accredited Legal Representative</option>
                    </select>
                </div>
                <div class="form-group flex-2">
                    <label>Name of Litigation Friend</label>
                    <input type="text" class="lf-name" placeholder="e.g., THE OFFICIAL SOLICITOR">
                </div>
            </div>
        </div>
    `;

    container.appendChild(entry);

    // Set up event listeners
    const checkbox = entry.querySelector('.has-litigation-friend');
    const lfDetails = entry.querySelector('.litigation-friend-details');
    checkbox.addEventListener('change', () => {
        lfDetails.classList.toggle('hidden', !checkbox.checked);
    });

    const removeBtn = entry.querySelector('.remove-party-btn');
    removeBtn.addEventListener('click', () => {
        if (container.querySelectorAll('.party-entry').length > 2) {
            entry.remove();
            renumberParties();
        } else {
            showToast('At least two parties are required', 'error');
        }
    });
}

function renumberParties() {
    const entries = document.querySelectorAll('.party-entry');
    entries.forEach((entry, index) => {
        entry.querySelector('.party-label').textContent = `Party ${index + 1}`;
    });
}

function collectParties() {
    const entries = document.querySelectorAll('.party-entry');
    const parties = [];

    entries.forEach(entry => {
        const name = entry.querySelector('.party-name').value.trim();
        const designation = entry.querySelector('.party-role').value;
        const hasLF = entry.querySelector('.has-litigation-friend').checked;
        const lfName = entry.querySelector('.lf-name')?.value.trim() || '';
        const lfRole = entry.querySelector('.lf-prefix')?.value || '';

        if (name) {
            parties.push({
                name,
                designation,
                hasLitigationFriend: hasLF,
                litigationFriendName: hasLF ? lfName : null,
                litigationFriendRole: hasLF ? lfRole : null
            });
        }
    });

    return parties;
}

// ============================================
// CASE DETAILS COLLECTION
// ============================================

function collectCaseDetails() {
    const courtName = document.getElementById('courtName');
    const caseNumber = document.getElementById('caseNumber');

    if (!caseNumber.value.trim()) {
        showToast('Please enter a case number', 'error');
        caseNumber.focus();
        return false;
    }

    const parties = collectParties();
    if (parties.length < 2) {
        showToast('Please enter at least two parties', 'error');
        return false;
    }

    AppState.parties = parties;
    AppState.caseDetails = {
        court: courtName.value,
        caseNumber: caseNumber.value.trim(),
        matterOf: document.getElementById('matterOf').value.trim(),
        inMatterPerson: document.getElementById('inMatterPerson').value.trim(),
        parties: parties,
        proceedingType: AppState.proceedingType
    };

    return true;
}

// ============================================
// DOCUMENT FORM
// ============================================

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
        document.getElementById(formId)?.classList.remove('hidden');
    }

    // Update step title
    const titles = {
        'witness-statement': 'Witness Statement Details',
        'skeleton-argument': 'Skeleton Argument Details',
        'position-statement': 'Position Statement Details',
        'draft-order': 'Draft Order Details'
    };
    const titleEl = document.getElementById('step3Title');
    if (titleEl) {
        titleEl.textContent = titles[AppState.documentType] || 'Document Content';
    }
}

// ============================================
// WRITING MODE TOGGLE
// ============================================

function initWritingModeToggle() {
    const modeBtns = document.querySelectorAll('.writing-mode-toggle .mode-btn');
    const structuredMode = document.getElementById('structuredMode');
    const freeMode = document.getElementById('freeMode');

    modeBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            modeBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            const mode = btn.dataset.mode;
            AppState.writingMode = mode;

            if (structuredMode && freeMode) {
                if (mode === 'structured') {
                    structuredMode.classList.remove('hidden');
                    freeMode.classList.add('hidden');
                } else {
                    structuredMode.classList.add('hidden');
                    freeMode.classList.remove('hidden');
                }
            }
        });
    });
}

// ============================================
// PARAGRAPH SYSTEM (Structured Mode)
// ============================================

function initParagraphSystem() {
    document.getElementById('addParagraphBtn')?.addEventListener('click', addParagraph);

    // Add initial paragraph
    setTimeout(() => {
        if (AppState.paragraphs.length === 0) {
            addParagraph();
        }
    }, 100);
}

function addParagraph(initialContent = '') {
    const container = document.getElementById('paragraphsContainer');
    if (!container) return;

    AppState.paragraphCounter++;
    const id = `para-${AppState.paragraphCounter}`;

    AppState.paragraphs.push({ id, content: initialContent });

    const card = document.createElement('div');
    card.className = 'paragraph-card';
    card.dataset.id = id;
    card.draggable = true;

    card.innerHTML = `
        <div class="paragraph-header">
            <span class="paragraph-drag-handle">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="9" cy="12" r="1"></circle>
                    <circle cx="9" cy="5" r="1"></circle>
                    <circle cx="9" cy="19" r="1"></circle>
                    <circle cx="15" cy="12" r="1"></circle>
                    <circle cx="15" cy="5" r="1"></circle>
                    <circle cx="15" cy="19" r="1"></circle>
                </svg>
            </span>
            <span class="paragraph-number">${AppState.paragraphs.length}.</span>
            <button type="button" class="remove-para-btn" title="Remove paragraph">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
            </button>
        </div>
        <textarea class="paragraph-content" placeholder="Enter paragraph text...">${initialContent}</textarea>
    `;

    container.appendChild(card);

    // Event listeners
    const textarea = card.querySelector('.paragraph-content');
    textarea.addEventListener('input', () => {
        const para = AppState.paragraphs.find(p => p.id === id);
        if (para) para.content = textarea.value;
        autoResizeTextarea(textarea);
    });

    const removeBtn = card.querySelector('.remove-para-btn');
    removeBtn.addEventListener('click', () => removeParagraph(id));

    // Drag and drop
    card.addEventListener('dragstart', handleDragStart);
    card.addEventListener('dragend', handleDragEnd);
    card.addEventListener('dragover', handleDragOver);
    card.addEventListener('drop', handleDrop);

    // Focus and auto-resize
    textarea.focus();
    autoResizeTextarea(textarea);
}

function removeParagraph(id) {
    const index = AppState.paragraphs.findIndex(p => p.id === id);
    if (index > -1) {
        AppState.paragraphs.splice(index, 1);
        const card = document.querySelector(`.paragraph-card[data-id="${id}"]`);
        if (card) card.remove();
        renumberParagraphs();
    }
}

function renumberParagraphs() {
    const cards = document.querySelectorAll('.paragraph-card');
    cards.forEach((card, index) => {
        card.querySelector('.paragraph-number').textContent = `${index + 1}.`;
    });
}

function autoResizeTextarea(textarea) {
    textarea.style.height = 'auto';
    textarea.style.height = textarea.scrollHeight + 'px';
}

// Drag and drop handlers
let draggedElement = null;

function handleDragStart(e) {
    draggedElement = this;
    this.classList.add('dragging');
    e.dataTransfer.effectAllowed = 'move';
}

function handleDragEnd(e) {
    this.classList.remove('dragging');
    draggedElement = null;
    document.querySelectorAll('.paragraph-card').forEach(card => {
        card.classList.remove('drag-over');
    });
}

function handleDragOver(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';

    if (draggedElement !== this) {
        this.classList.add('drag-over');
    }
}

function handleDrop(e) {
    e.preventDefault();
    this.classList.remove('drag-over');

    if (draggedElement !== this) {
        const container = document.getElementById('paragraphsContainer');
        const allCards = [...container.querySelectorAll('.paragraph-card')];
        const draggedIndex = allCards.indexOf(draggedElement);
        const dropIndex = allCards.indexOf(this);

        // Reorder DOM
        if (draggedIndex < dropIndex) {
            this.after(draggedElement);
        } else {
            this.before(draggedElement);
        }

        // Reorder state
        const draggedPara = AppState.paragraphs.splice(draggedIndex, 1)[0];
        AppState.paragraphs.splice(dropIndex, 0, draggedPara);

        renumberParagraphs();
    }
}

// ============================================
// PHRASE SUGGESTIONS
// ============================================

function initPhraseSuggestions() {
    document.querySelectorAll('.phrase-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const phrase = btn.dataset.phrase;
            insertPhrase(phrase);
        });
    });
}

function insertPhrase(phrase) {
    if (AppState.writingMode === 'structured') {
        // In structured mode, add as new paragraph or append to active textarea
        const activeTextarea = document.activeElement;
        if (activeTextarea && activeTextarea.classList.contains('paragraph-content')) {
            // Append to current paragraph
            const cursorPos = activeTextarea.selectionStart;
            const before = activeTextarea.value.substring(0, cursorPos);
            const after = activeTextarea.value.substring(cursorPos);
            activeTextarea.value = before + phrase + after;
            activeTextarea.selectionStart = activeTextarea.selectionEnd = cursorPos + phrase.length;
            activeTextarea.dispatchEvent(new Event('input'));
            activeTextarea.focus();
        } else {
            // Add as new paragraph
            addParagraph(phrase);
        }
    } else {
        // Free mode - insert into freeWritingArea
        const textarea = document.getElementById('freeWritingArea');
        if (textarea) {
            const cursorPos = textarea.selectionStart;
            const before = textarea.value.substring(0, cursorPos);
            const after = textarea.value.substring(cursorPos);
            textarea.value = before + phrase + after;
            textarea.selectionStart = textarea.selectionEnd = cursorPos + phrase.length;
            textarea.focus();
        }
    }
}

// ============================================
// EXHIBIT SYSTEM
// ============================================

function initExhibitSystem() {
    document.getElementById('addExhibitBtn')?.addEventListener('click', addExhibit);

    // Show/hide custom type field when "Other" is selected
    const typeSelect = document.getElementById('newExhibitType');
    const customTypeGroup = document.getElementById('exhibitCustomTypeGroup');
    if (typeSelect && customTypeGroup) {
        typeSelect.addEventListener('change', () => {
            customTypeGroup.style.display = typeSelect.value === 'Other' ? 'block' : 'none';
        });
    }
}

function addExhibit() {
    const container = document.getElementById('exhibitsContainer');
    if (!container) return;

    // Get values from the form fields
    const typeSelect = document.getElementById('newExhibitType');
    const dateInput = document.getElementById('newExhibitDate');
    const customTypeInput = document.getElementById('newExhibitCustomType');
    const descriptionInput = document.getElementById('newExhibitDescription');

    const selectedType = typeSelect?.value;
    if (!selectedType) {
        showToast('Please select a document type', 'error');
        return;
    }

    const customType = selectedType === 'Other' ? customTypeInput?.value.trim() : '';
    if (selectedType === 'Other' && !customType) {
        showToast('Please enter a custom document type', 'error');
        return;
    }

    AppState.exhibitCounter++;
    const id = `exhibit-${AppState.exhibitCounter}`;

    // Generate exhibit mark based on witness initials
    const witnessName = document.getElementById('witnessName')?.value || '';
    const initials = witnessName.split(' ').map(n => n[0]?.toUpperCase() || '').join('') || 'XX';
    const mark = `${initials}-${AppState.exhibitCounter}`;

    // Format the date if provided
    const dateValue = dateInput?.value;
    const formattedDate = dateValue ? new Date(dateValue).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) : '';

    // Build the description
    const docType = selectedType === 'Other' ? customType : selectedType;
    const description = descriptionInput?.value.trim() || '';
    const fullDescription = formattedDate
        ? (description ? `${description}, dated ${formattedDate}` : `dated ${formattedDate}`)
        : description;

    // Add to state
    AppState.exhibits.push({ id, type: docType, description: fullDescription, mark });

    // Create display item
    const item = document.createElement('div');
    item.className = 'exhibit-item';
    item.dataset.id = id;

    item.innerHTML = `
        <div class="exhibit-header">
            <span class="exhibit-number">${mark}</span>
            <button type="button" class="remove-exhibit-btn" title="Remove exhibit">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
            </button>
        </div>
        <div class="exhibit-content">
            <span class="exhibit-type-label">${escapeHtml(docType)}</span>
            ${fullDescription ? `<span class="exhibit-desc">${escapeHtml(fullDescription)}</span>` : ''}
        </div>
    `;

    container.appendChild(item);

    // Add remove listener
    item.querySelector('.remove-exhibit-btn').addEventListener('click', () => {
        removeExhibit(id);
    });

    // Clear the form fields for next exhibit
    typeSelect.value = '';
    if (dateInput) dateInput.value = '';
    if (customTypeInput) customTypeInput.value = '';
    if (descriptionInput) descriptionInput.value = '';
    document.getElementById('exhibitCustomTypeGroup').style.display = 'none';

    showToast(`Exhibit ${mark} added`, 'success');
}

function removeExhibit(id) {
    const index = AppState.exhibits.findIndex(e => e.id === id);
    if (index > -1) {
        AppState.exhibits.splice(index, 1);
        const item = document.querySelector(`.exhibit-item[data-id="${id}"]`);
        if (item) item.remove();
        renumberExhibits();
    }
}

function renumberExhibits() {
    const items = document.querySelectorAll('.exhibit-item');
    items.forEach((item, index) => {
        item.querySelector('.exhibit-number').textContent = `Exhibit ${index + 1}`;
    });
}

function collectExhibits() {
    // Return exhibits from state (already collected when added)
    return AppState.exhibits.map(ex => ({
        type: ex.type,
        description: ex.description,
        mark: ex.mark
    }));
}

// ============================================
// DOCUMENT CONTENT COLLECTION
// ============================================

function collectDocumentContent() {
    switch (AppState.documentType) {
        case 'witness-statement':
            const body = AppState.writingMode === 'structured'
                ? AppState.paragraphs.map(p => p.content).filter(c => c.trim())
                : document.getElementById('freeWritingArea')?.value.split('\n\n').filter(p => p.trim()) || [];

            AppState.documentContent = {
                witnessName: document.getElementById('witnessName')?.value.trim() || '',
                witnessRole: document.getElementById('witnessRole')?.value.trim() || '',
                witnessAddress: document.getElementById('witnessAddress')?.value.trim() || '',
                statementNumber: document.getElementById('statementNumber')?.value || 'First',
                exhibitMark: document.getElementById('exhibitMark')?.value.trim() || '',
                introduction: document.getElementById('wsIntro')?.value.trim() || '',
                paragraphs: body,
                exhibits: collectExhibits()
            };
            break;

        case 'skeleton-argument':
            AppState.documentContent = {
                hearingDate: document.getElementById('hearingDate')?.value || '',
                hearingType: document.getElementById('hearingType')?.value.trim() || '',
                timeEstimate: document.getElementById('timeEstimate')?.value.trim() || '',
                introduction: document.getElementById('skIntro')?.value.trim() || '',
                issues: document.getElementById('skIssues')?.value.trim() || '',
                law: document.getElementById('skLaw')?.value.trim() || '',
                application: document.getElementById('skApplication')?.value.trim() || '',
                relief: document.getElementById('skRelief')?.value.trim() || '',
                authorities: document.getElementById('skAuthorities')?.value.trim() || ''
            };
            break;

        case 'position-statement':
            AppState.documentContent = {
                hearingDate: document.getElementById('psHearingDate')?.value || '',
                onBehalfOf: document.getElementById('psOnBehalfOf')?.value.trim() || '',
                introduction: document.getElementById('psIntro')?.value.trim() || '',
                currentPosition: document.getElementById('psCurrentPosition')?.value.trim() || '',
                ordersSought: document.getElementById('psOrders')?.value.trim() || '',
                outstanding: document.getElementById('psOutstanding')?.value.trim() || ''
            };
            break;

        case 'draft-order':
            AppState.documentContent = {
                orderType: document.getElementById('orderType')?.value || 'ORDER',
                judgeName: document.getElementById('judgeName')?.value.trim() || '',
                recitals: document.getElementById('recitals')?.value.trim() || '',
                provisions: document.getElementById('orderProvisions')?.value.trim() || '',
                serviceProvisions: document.getElementById('serviceProvisions')?.value.trim() || '',
                costsProvisions: document.getElementById('costsProvisions')?.value.trim() || ''
            };
            break;
    }

    return true;
}

// ============================================
// PREVIEW RENDERING
// ============================================

function setDefaultDate() {
    const dateInput = document.getElementById('documentDate');
    if (dateInput && !dateInput.value) {
        dateInput.value = new Date().toISOString().split('T')[0];
    }
}

function renderPreview() {
    const preview = document.getElementById('previewContent');
    if (!preview) return;

    const cd = AppState.caseDetails;
    const dc = AppState.documentContent;
    const parties = cd.parties || [];
    const separator = cd.proceedingType === 'adversarial' ? '- v -' : '- and -';

    let html = '<div class="doc-header">';

    // Case Number (right aligned)
    html += `<div class="case-no">Case No: ${escapeHtml(cd.caseNumber)}</div>`;

    // Court Name (left aligned)
    if (cd.court) {
        const courtLines = cd.court.split('\n');
        courtLines.forEach(line => {
            html += `<div class="court-line">${escapeHtml(line)}</div>`;
        });
    }

    // In the Matter Of (statute)
    if (cd.matterOf) {
        html += `<div class="matter">IN THE MATTER OF ${escapeHtml(cd.matterOf)}</div>`;
    }

    // In the Matter Of (person/property)
    if (cd.inMatterPerson) {
        html += `<div class="matter">IN THE MATTER OF:</div>`;
        html += `<div class="matter-person">${escapeHtml(cd.inMatterPerson)}</div>`;
    }

    // Parties
    if (parties.length >= 2) {
        html += `<div class="between">B E T W E E N:</div>`;

        // First party
        html += `<div class="party">${escapeHtml(parties[0].name).toUpperCase()}</div>`;
        if (parties[0].hasLitigationFriend && parties[0].litigationFriendName) {
            html += `<div class="lf-details">(By ${parties[0].litigationFriendRole === 'Accredited Legal Representative' ? 'her Accredited Legal Representative' : 'his/her litigation friend'} ${escapeHtml(parties[0].litigationFriendName)})</div>`;
        }
        html += `<div class="designation">${escapeHtml(parties[0].designation)}</div>`;

        html += `<div class="separator">${separator}</div>`;

        // Second party
        html += `<div class="party">${escapeHtml(parties[1].name).toUpperCase()}</div>`;
        if (parties[1].hasLitigationFriend && parties[1].litigationFriendName) {
            html += `<div class="lf-details">(By ${parties[1].litigationFriendRole === 'Accredited Legal Representative' ? 'her Accredited Legal Representative' : 'his/her litigation friend'} ${escapeHtml(parties[1].litigationFriendName)})</div>`;
        }
        html += `<div class="designation">${escapeHtml(parties[1].designation)}</div>`;

        // Additional parties
        for (let i = 2; i < parties.length; i++) {
            html += `<div class="separator">${separator}</div>`;
            html += `<div class="party">${escapeHtml(parties[i].name).toUpperCase()}</div>`;
            if (parties[i].hasLitigationFriend && parties[i].litigationFriendName) {
                html += `<div class="lf-details">(By ${parties[i].litigationFriendRole === 'Accredited Legal Representative' ? 'her Accredited Legal Representative' : 'his/her litigation friend'} ${escapeHtml(parties[i].litigationFriendName)})</div>`;
            }
            html += `<div class="designation">${escapeHtml(parties[i].designation)}</div>`;
        }
    }

    html += `<hr class="header-line">`;

    // Document title
    const docTitles = {
        'witness-statement': `WITNESS STATEMENT OF ${dc.witnessName?.toUpperCase() || 'WITNESS'}`,
        'skeleton-argument': 'SKELETON ARGUMENT',
        'position-statement': `POSITION STATEMENT ON BEHALF OF THE ${parties[0]?.designation?.toUpperCase() || 'APPLICANT'}`,
        'draft-order': dc.orderType || 'ORDER'
    };

    html += `<div class="doc-title">${docTitles[AppState.documentType]}</div>`;
    html += `<hr class="header-line">`;
    html += `</div>`; // End doc-header

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

    // Statement details box
    html += `<div class="ws-details">`;
    html += `<p><strong>${dc.statementNumber}</strong> witness statement of <strong>${escapeHtml(dc.witnessName)}</strong></p>`;
    if (dc.exhibitMark) {
        html += `<p>Exhibit: ${escapeHtml(dc.exhibitMark)}</p>`;
    }
    html += `</div>`;

    // Introduction
    if (dc.introduction) {
        html += `<p>${escapeHtml(dc.introduction)}</p>`;
    }

    // Paragraphs
    if (dc.paragraphs && dc.paragraphs.length > 0) {
        dc.paragraphs.forEach((p, i) => {
            html += `<p class="numbered"><span class="para-num">${i + 1}.</span> ${escapeHtml(p)}</p>`;
        });
    }

    // Exhibits section
    if (dc.exhibits && dc.exhibits.length > 0) {
        html += `<p class="section-heading"><strong>EXHIBITS</strong></p>`;
        dc.exhibits.forEach(ex => {
            html += `<p class="exhibit-line">${escapeHtml(ex.mark)}: ${escapeHtml(ex.type)}${ex.description ? ' (' + escapeHtml(ex.description) + ')' : ''}</p>`;
        });
    }

    // Statement of Truth
    html += `
        <div class="statement-of-truth">
            <p><strong>STATEMENT OF TRUTH</strong></p>
            <p>I believe that the facts stated in this witness statement are true. I understand that proceedings for contempt of court may be brought against anyone who makes, or causes to be made, a false statement in a document verified by a statement of truth without an honest belief in its truth.</p>
            <div class="signature-block">
                <p>Signed: ____________________________</p>
                <p>Name: ${escapeHtml(dc.witnessName)}</p>
                <p>Date: ____________________________</p>
            </div>
        </div>
    `;

    return html;
}

function renderSkeletonBody(dc) {
    let html = '';

    const sections = [
        { title: 'Introduction', content: dc.introduction },
        { title: 'Issues', content: dc.issues },
        { title: 'Legal Framework', content: dc.law },
        { title: 'Application of Law to Facts', content: dc.application },
        { title: 'Relief Sought', content: dc.relief }
    ];

    sections.forEach(section => {
        if (section.content) {
            html += `<p class="section-heading"><strong>${section.title}</strong></p>`;
            html += `<p>${escapeHtml(section.content).replace(/\n/g, '<br>')}</p>`;
        }
    });

    if (dc.timeEstimate) {
        html += `<p><strong>Time Estimate:</strong> ${escapeHtml(dc.timeEstimate)}</p>`;
    }

    if (dc.authorities) {
        html += `<p class="section-heading"><strong>Authorities</strong></p>`;
        html += `<p>${escapeHtml(dc.authorities).replace(/\n/g, '<br>')}</p>`;
    }

    return html;
}

function renderPositionStatementBody(dc) {
    let html = '';
    let paraNum = 1;

    if (dc.introduction) {
        const paras = dc.introduction.split('\n\n');
        paras.forEach(p => {
            if (p.trim()) {
                html += `<p class="numbered"><span class="para-num">${paraNum++}.</span> ${escapeHtml(p.trim())}</p>`;
            }
        });
    }

    if (dc.currentPosition) {
        html += `<p class="section-heading"><strong>CURRENT POSITION</strong></p>`;
        const paras = dc.currentPosition.split('\n\n');
        paras.forEach(p => {
            if (p.trim()) {
                html += `<p class="numbered"><span class="para-num">${paraNum++}.</span> ${escapeHtml(p.trim())}</p>`;
            }
        });
    }

    if (dc.ordersSought) {
        html += `<p class="section-heading"><strong>ORDERS SOUGHT</strong></p>`;
        html += `<p>${escapeHtml(dc.ordersSought).replace(/\n/g, '<br>')}</p>`;
    }

    if (dc.outstanding) {
        html += `<p class="section-heading"><strong>OUTSTANDING ISSUES</strong></p>`;
        html += `<p>${escapeHtml(dc.outstanding).replace(/\n/g, '<br>')}</p>`;
    }

    return html;
}

function renderDraftOrderBody(dc) {
    let html = '';

    if (dc.judgeName) {
        html += `<p><strong>BEFORE:</strong> ${escapeHtml(dc.judgeName)}</p>`;
    }

    if (dc.recitals) {
        const recitals = dc.recitals.split('\n');
        recitals.forEach(r => {
            if (r.trim()) {
                html += `<p>${escapeHtml(r.trim())}</p>`;
            }
        });
    }

    html += `<p><strong>IT IS ORDERED THAT:</strong></p>`;

    if (dc.provisions) {
        const provisions = dc.provisions.split('\n\n');
        provisions.forEach((p, i) => {
            if (p.trim()) {
                html += `<p class="numbered"><span class="para-num">${i + 1}.</span> ${escapeHtml(p.trim())}</p>`;
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

// ============================================
// DOWNLOAD BUTTONS
// ============================================

function initDownloadButtons() {
    document.getElementById('downloadWord')?.addEventListener('click', downloadWord);
    document.getElementById('downloadPDF')?.addEventListener('click', downloadPDF);
}

// ============================================
// WORD DOCUMENT GENERATION
// ============================================

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
    const parties = cd.parties || [];
    const separator = cd.proceedingType === 'adversarial' ? '- v -' : '- and -';
    const preparedBy = document.getElementById('preparedBy')?.value || 'Sarah Okafor, Barrister';
    const docDate = formatDate(document.getElementById('documentDate')?.value);

    const children = [];

    // Case Number (right aligned)
    children.push(new Paragraph({
        children: [new TextRun({ text: `Case No: ${cd.caseNumber}`, font: 'Century Gothic', size: 24, bold: true })],
        alignment: AlignmentType.RIGHT,
        spacing: { after: 200 }
    }));

    // Court Name (left aligned)
    if (cd.court) {
        const courtLines = cd.court.split('\n');
        courtLines.forEach(line => {
            children.push(new Paragraph({
                children: [new TextRun({ text: line, font: 'Century Gothic', size: 24, bold: true })],
                alignment: AlignmentType.LEFT
            }));
        });
    }

    // In the Matter Of (statute)
    if (cd.matterOf) {
        children.push(new Paragraph({
            children: [new TextRun({ text: `IN THE MATTER OF ${cd.matterOf}`, font: 'Century Gothic', size: 24, bold: true })],
            alignment: AlignmentType.LEFT,
            spacing: { before: 200 }
        }));
    }

    // In the Matter Of (person/property)
    if (cd.inMatterPerson) {
        children.push(new Paragraph({
            children: [new TextRun({ text: 'IN THE MATTER OF:', font: 'Century Gothic', size: 24, bold: true })],
            alignment: AlignmentType.LEFT,
            spacing: { before: 200 }
        }));
        children.push(new Paragraph({
            children: [new TextRun({ text: cd.inMatterPerson, font: 'Century Gothic', size: 24, bold: true })],
            alignment: AlignmentType.CENTER
        }));
    }

    // Parties
    if (parties.length >= 2) {
        children.push(new Paragraph({
            children: [new TextRun({ text: 'B E T W E E N:', font: 'Century Gothic', size: 24, bold: true })],
            alignment: AlignmentType.LEFT,
            spacing: { before: 400 }
        }));

        // Add each party
        parties.forEach((party, index) => {
            if (index > 0) {
                children.push(new Paragraph({
                    children: [new TextRun({ text: separator, font: 'Century Gothic', size: 24 })],
                    alignment: AlignmentType.CENTER,
                    spacing: { before: 200 }
                }));
            }

            // Party name (centred, uppercase)
            children.push(new Paragraph({
                children: [new TextRun({ text: party.name.toUpperCase(), font: 'Century Gothic', size: 24, bold: true })],
                alignment: AlignmentType.CENTER,
                spacing: { before: 200 }
            }));

            // Litigation friend if applicable
            if (party.hasLitigationFriend && party.litigationFriendName) {
                const lfText = party.litigationFriendRole === 'Accredited Legal Representative'
                    ? `(By her Accredited Legal Representative ${party.litigationFriendName})`
                    : `(By his/her litigation friend ${party.litigationFriendName})`;
                children.push(new Paragraph({
                    children: [new TextRun({ text: lfText, font: 'Century Gothic', size: 24 })],
                    alignment: AlignmentType.CENTER
                }));
            }

            // Designation (right aligned)
            children.push(new Paragraph({
                children: [new TextRun({ text: party.designation, font: 'Century Gothic', size: 24, italics: true })],
                alignment: AlignmentType.RIGHT
            }));
        });
    }

    // Horizontal line
    children.push(createHorizontalLine());

    // Document title
    const docTitles = {
        'witness-statement': `WITNESS STATEMENT OF ${dc.witnessName?.toUpperCase() || 'WITNESS'}`,
        'skeleton-argument': 'SKELETON ARGUMENT',
        'position-statement': `POSITION STATEMENT ON BEHALF OF THE ${parties[0]?.designation?.toUpperCase() || 'APPLICANT'}`,
        'draft-order': dc.orderType || 'ORDER'
    };

    children.push(new Paragraph({
        children: [new TextRun({ text: docTitles[AppState.documentType], font: 'Century Gothic', size: 24, bold: true })],
        alignment: AlignmentType.CENTER,
        spacing: { before: 200, after: 200 }
    }));

    // Horizontal line
    children.push(createHorizontalLine());

    // Document body based on type
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

    // Numbered paragraphs
    if (dc.paragraphs && dc.paragraphs.length > 0) {
        dc.paragraphs.forEach((p, i) => {
            children.push(new Paragraph({
                children: [new TextRun({ text: `${i + 1}.\t${p}`, font: 'Century Gothic', size: 24 })],
                indent: { left: 720, hanging: 720 },
                spacing: { after: 200, line: 360 }
            }));
        });
    }

    // Exhibits
    if (dc.exhibits && dc.exhibits.length > 0) {
        children.push(new Paragraph({
            children: [new TextRun({ text: 'EXHIBITS', font: 'Century Gothic', size: 24, bold: true })],
            spacing: { before: 400, after: 200 }
        }));

        dc.exhibits.forEach(ex => {
            const exText = `${ex.mark}: ${ex.type}${ex.description ? ' (' + ex.description + ')' : ''}`;
            children.push(new Paragraph({
                children: [new TextRun({ text: exText, font: 'Century Gothic', size: 24 })],
                spacing: { after: 120 }
            }));
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
    let paraNum = 1;

    if (dc.introduction) {
        const paragraphs = dc.introduction.split('\n\n');
        paragraphs.forEach(p => {
            if (p.trim()) {
                children.push(new Paragraph({
                    children: [new TextRun({ text: `${paraNum++}.\t${p.trim()}`, font: 'Century Gothic', size: 24 })],
                    indent: { left: 720, hanging: 720 },
                    spacing: { after: 200, line: 360 }
                }));
            }
        });
    }

    if (dc.currentPosition) {
        children.push(new Paragraph({
            children: [new TextRun({ text: 'CURRENT POSITION', font: 'Century Gothic', size: 24, bold: true, underline: {} })],
            spacing: { before: 400, after: 200 }
        }));

        const paragraphs = dc.currentPosition.split('\n\n');
        paragraphs.forEach(p => {
            if (p.trim()) {
                children.push(new Paragraph({
                    children: [new TextRun({ text: `${paraNum++}.\t${p.trim()}`, font: 'Century Gothic', size: 24 })],
                    indent: { left: 720, hanging: 720 },
                    spacing: { after: 200, line: 360 }
                }));
            }
        });
    }

    if (dc.ordersSought) {
        children.push(new Paragraph({
            children: [new TextRun({ text: 'ORDERS SOUGHT', font: 'Century Gothic', size: 24, bold: true, underline: {} })],
            spacing: { before: 400, after: 200 }
        }));

        const lines = dc.ordersSought.split('\n');
        lines.forEach(l => {
            if (l.trim()) {
                children.push(new Paragraph({
                    children: [new TextRun({ text: l.trim(), font: 'Century Gothic', size: 24 })],
                    spacing: { after: 120, line: 360 }
                }));
            }
        });
    }

    if (dc.outstanding) {
        children.push(new Paragraph({
            children: [new TextRun({ text: 'OUTSTANDING ISSUES', font: 'Century Gothic', size: 24, bold: true, underline: {} })],
            spacing: { before: 400, after: 200 }
        }));

        children.push(new Paragraph({
            children: [new TextRun({ text: dc.outstanding, font: 'Century Gothic', size: 24 })],
            spacing: { after: 200, line: 360 }
        }));
    }
}

function addDraftOrderContent(children, dc) {
    if (dc.judgeName) {
        children.push(new Paragraph({
            children: [
                new TextRun({ text: 'BEFORE: ', font: 'Century Gothic', size: 24, bold: true }),
                new TextRun({ text: dc.judgeName, font: 'Century Gothic', size: 24 })
            ],
            spacing: { before: 400, after: 200 }
        }));
    }

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
        provisions.forEach((p, i) => {
            if (p.trim()) {
                children.push(new Paragraph({
                    children: [new TextRun({ text: `${i + 1}.\t${p.trim()}`, font: 'Century Gothic', size: 24 })],
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

// ============================================
// PDF DOCUMENT GENERATION
// ============================================

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
        const parties = cd.parties || [];
        const separator = cd.proceedingType === 'adversarial' ? '- v -' : '- and -';
        const preparedBy = document.getElementById('preparedBy')?.value || 'Sarah Okafor, Barrister';
        const docDate = formatDate(document.getElementById('documentDate')?.value);

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
        addText(`Case No: ${cd.caseNumber}`, margin, { align: 'right', bold: true });
        y += 2;

        // Court Name
        if (cd.court) {
            const courtLines = cd.court.split('\n');
            courtLines.forEach(line => {
                addText(line, margin, { bold: true });
            });
        }
        y += 4;

        // Matter Of
        if (cd.matterOf) {
            addText(`IN THE MATTER OF ${cd.matterOf}`, margin, { bold: true });
        }

        if (cd.inMatterPerson) {
            addText('IN THE MATTER OF:', margin, { bold: true });
            addText(cd.inMatterPerson, margin, { align: 'center', bold: true });
        }
        y += 4;

        // Parties
        if (parties.length >= 2) {
            addText('B E T W E E N:', margin, { bold: true });
            y += 2;

            parties.forEach((party, index) => {
                if (index > 0) {
                    addText(separator, margin, { align: 'center' });
                    y += 2;
                }

                addText(party.name.toUpperCase(), margin, { align: 'center', bold: true });

                if (party.hasLitigationFriend && party.litigationFriendName) {
                    const lfText = party.litigationFriendRole === 'Accredited Legal Representative'
                        ? `(By her Accredited Legal Representative ${party.litigationFriendName})`
                        : `(By his/her litigation friend ${party.litigationFriendName})`;
                    addText(lfText, margin, { align: 'center' });
                }

                addText(party.designation, margin, { align: 'right' });
                y += 2;
            });
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
            'position-statement': `POSITION STATEMENT ON BEHALF OF THE ${parties[0]?.designation?.toUpperCase() || 'APPLICANT'}`,
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
    let y = doc.internal.pageSize.getHeight() - 250; // Get approximate y position

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

    // Numbered paragraphs
    if (dc.paragraphs && dc.paragraphs.length > 0) {
        dc.paragraphs.forEach((p, i) => {
            checkPageBreak();
            addWrappedText(`${i + 1}. ${p}`, margin);
        });
    }

    // Exhibits
    if (dc.exhibits && dc.exhibits.length > 0) {
        checkPageBreak();
        addWrappedText('EXHIBITS', margin, { bold: true });
        dc.exhibits.forEach(ex => {
            addWrappedText(`${ex.mark}: ${ex.type}${ex.description ? ' (' + ex.description + ')' : ''}`, margin);
        });
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
    let paraNum = 1;

    if (dc.introduction) {
        const paras = dc.introduction.split('\n\n');
        paras.forEach(p => {
            if (p.trim()) {
                checkPageBreak();
                addWrappedText(`${paraNum++}. ${p.trim()}`, margin);
            }
        });
    }

    if (dc.currentPosition) {
        checkPageBreak();
        addWrappedText('CURRENT POSITION', margin, { bold: true });
        const paras = dc.currentPosition.split('\n\n');
        paras.forEach(p => {
            if (p.trim()) {
                addWrappedText(`${paraNum++}. ${p.trim()}`, margin);
            }
        });
    }

    if (dc.ordersSought) {
        checkPageBreak();
        addWrappedText('ORDERS SOUGHT', margin, { bold: true });
        addWrappedText(dc.ordersSought, margin);
    }

    if (dc.outstanding) {
        checkPageBreak();
        addWrappedText('OUTSTANDING ISSUES', margin, { bold: true });
        addWrappedText(dc.outstanding, margin);
    }
}

function addPDFDraftOrder(doc, dc, margin, maxWidth, addText, addWrappedText, checkPageBreak) {
    if (dc.judgeName) {
        addWrappedText(`BEFORE: ${dc.judgeName}`, margin, { bold: true });
    }

    if (dc.recitals) {
        addWrappedText(dc.recitals, margin);
    }

    checkPageBreak();
    addWrappedText('IT IS ORDERED THAT:', margin, { bold: true });

    if (dc.provisions) {
        const provisions = dc.provisions.split('\n\n');
        provisions.forEach((p, i) => {
            if (p.trim()) {
                checkPageBreak();
                addWrappedText(`${i + 1}. ${p.trim()}`, margin);
            }
        });
    }

    if (dc.serviceProvisions) {
        checkPageBreak();
        addWrappedText(dc.serviceProvisions, margin);
    }

    if (dc.costsProvisions) {
        addWrappedText(dc.costsProvisions, margin);
    }
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

function generateFilename(ext) {
    const cd = AppState.caseDetails;
    const dc = AppState.documentContent;
    const types = {
        'witness-statement': 'Witness_Statement',
        'skeleton-argument': 'Skeleton_Argument',
        'position-statement': 'Position_Statement',
        'draft-order': 'Draft_Order'
    };

    const docType = types[AppState.documentType] || 'Document';
    const caseNum = cd.caseNumber?.replace(/[^a-zA-Z0-9]/g, '_') || 'Draft';
    const date = new Date().toISOString().split('T')[0];
    const name = dc.witnessName?.replace(/[^a-zA-Z0-9]/g, '_') || '';

    if (AppState.documentType === 'witness-statement' && name) {
        return `${docType}_${name}_${date}.${ext}`;
    }

    return `${docType}_${caseNum}_${date}.${ext}`;
}

function formatDate(dateStr) {
    if (!dateStr) return new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });

    const date = new Date(dateStr);
    return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
}

function clearAllForms() {
    // Clear inputs
    document.querySelectorAll('input:not([type="date"]), textarea').forEach(el => {
        if (el.id !== 'preparedBy') {
            el.value = '';
        }
    });

    // Reset selects
    document.querySelectorAll('select').forEach(el => {
        el.selectedIndex = 0;
    });

    // Clear selected cards
    document.querySelectorAll('.doc-type-card').forEach(c => c.classList.remove('selected'));

    // Clear parties
    const partiesContainer = document.getElementById('partiesContainer');
    if (partiesContainer) {
        partiesContainer.innerHTML = '';
        addPartyEntry();
        addPartyEntry();
    }

    // Clear paragraphs
    const paragraphsContainer = document.getElementById('paragraphsContainer');
    if (paragraphsContainer) {
        paragraphsContainer.innerHTML = '';
    }
    AppState.paragraphs = [];
    AppState.paragraphCounter = 0;

    // Clear exhibits
    const exhibitsContainer = document.getElementById('exhibitsContainer');
    if (exhibitsContainer) {
        exhibitsContainer.innerHTML = '';
    }
    AppState.exhibits = [];
    AppState.exhibitCounter = 0;

    // Reset toggles
    document.querySelectorAll('.toggle-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.value === 'non-adversarial');
    });

    document.querySelectorAll('.mode-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.mode === 'structured');
    });

    // Show structured mode
    document.getElementById('structuredMode')?.classList.remove('hidden');
    document.getElementById('freeMode')?.classList.add('hidden');

    // Reset progress bar
    document.querySelectorAll('.progress-step').forEach((ps, index) => {
        ps.classList.remove('active', 'completed');
        if (index === 0) ps.classList.add('active');
    });
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
