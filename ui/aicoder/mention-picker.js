class MentionPicker extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.isVisible = false;
    this.selectedIndex = 0;
    this.filteredItems = [];
    this.searchTerm = '';
    this.position = { x: 0, y: 0 };
    this.targetElement = null;
    this.mentionStartIndex = 0;
    
    // Default list of names - can be customized via attributes or methods
    this.mentionItems = [
      { id: 'john_doe', name: 'John Doe', avatar: '👨', title: 'Software Engineer' },
      { id: 'jane_smith', name: 'Jane Smith', avatar: '👩', title: 'Product Manager' },
      { id: 'alex_johnson', name: 'Alex Johnson', avatar: '🧑', title: 'Designer' },
      { id: 'sarah_wilson', name: 'Sarah Wilson', avatar: '👩‍💼', title: 'Marketing Lead' },
      { id: 'mike_brown', name: 'Mike Brown', avatar: '👨‍💻', title: 'Developer' },
      { id: 'lisa_davis', name: 'Lisa Davis', avatar: '👩‍🔬', title: 'Data Scientist' },
      { id: 'tom_garcia', name: 'Tom Garcia', avatar: '👨‍🎨', title: 'UI Designer' },
      { id: 'emma_martinez', name: 'Emma Martinez', avatar: '👩‍⚖️', title: 'Legal Counsel' },
      { id: 'david_lee', name: 'David Lee', avatar: '👨‍🏫', title: 'Team Lead' },
      { id: 'anna_taylor', name: 'Anna Taylor', avatar: '👩‍🚀', title: 'DevOps Engineer' }
    ];
    
    this.shadowRoot.innerHTML = `
      <style>
        :host {
          position: absolute;
          z-index: 1000;
          display: none;
          max-width: 300px;
          background: white;
          border: 1px solid #e1e5e9;
          border-radius: 8px;
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          overflow: hidden;
        }
        
        :host([visible]) {
          display: block;
          animation: slideIn 0.15s ease-out;
        }
        
        .mention-list {
          max-height: 200px;
          overflow-y: auto;
          padding: 4px 0;
        }
        
        .mention-item {
          display: flex;
          align-items: center;
          padding: 8px 12px;
          cursor: pointer;
          transition: background-color 0.1s ease;
          border: none;
          background: none;
          width: 100%;
          text-align: left;
          font-size: 14px;
        }
        
        .mention-item:hover,
        .mention-item.selected {
          background-color: #f0f2f5;
        }
        
        .mention-item.selected {
          background-color: #e3f2fd;
        }
        
        .mention-avatar {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: linear-gradient(45deg, #667eea, #764ba2);
          display: flex;
          align-items: center;
          justify-content: center;
          margin-right: 10px;
          font-size: 16px;
          flex-shrink: 0;
        }
        
        .mention-info {
          flex: 1;
          min-width: 0;
        }
        
        .mention-name {
          font-weight: 600;
          color: #1c1e21;
          margin-bottom: 2px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        
        .mention-title {
          font-size: 12px;
          color: #65676b;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        
        .no-results {
          padding: 16px 12px;
          text-align: center;
          color: #65676b;
          font-size: 14px;
          font-style: italic;
        }
        
        .mention-list::-webkit-scrollbar {
          width: 6px;
        }
        
        .mention-list::-webkit-scrollbar-track {
          background: transparent;
        }
        
        .mention-list::-webkit-scrollbar-thumb {
          background: #c4c4c4;
          border-radius: 3px;
        }
        
        .mention-list::-webkit-scrollbar-thumb:hover {
          background: #a8a8a8;
        }
        
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .highlight {
          background-color: #fff3cd;
          font-weight: bold;
          padding: 1px 2px;
          border-radius: 2px;
        }
      </style>
      
      <div class="mention-list" id="mentionList">
        <!-- Items will be populated dynamically -->
      </div>
    `;
    
    this.mentionList = this.shadowRoot.getElementById('mentionList');
    this.bindEvents();
  }
  
  bindEvents() {
    // Handle clicks on mention items
    this.mentionList.addEventListener('click', (e) => {
      const item = e.target.closest('.mention-item');
      if (item) {
        const index = parseInt(item.dataset.index);
        this.selectMention(index);
      }
    });
    
    // Handle mouse hover
    this.mentionList.addEventListener('mouseover', (e) => {
      const item = e.target.closest('.mention-item');
      if (item) {
        this.selectedIndex = parseInt(item.dataset.index);
        this.updateSelection();
      }
    });
  }
  
  // Set up the mention picker for a contenteditable element
  attachTo(element) {
    if (!element) return;
    
    this.targetElement = element;
    
    // Insert this component into the DOM if not already present
    if (!this.parentNode) {
      document.body.appendChild(this);
    }
    
    // Listen for input events
    element.addEventListener('input', (e) => this.handleInput(e));
    element.addEventListener('keydown', (e) => this.handleKeyDown(e));
    
    // Hide on blur (with small delay to allow clicks)
    element.addEventListener('blur', () => {
      setTimeout(() => this.hide(), 150);
    });
    
    // Hide when clicking outside
    document.addEventListener('click', (e) => {
      if (!this.contains(e.target) && e.target !== element) {
        this.hide();
      }
    });
  }
  
  handleInput(e) {
    if (!this.targetElement) return;
    
    const selection = window.getSelection();
    if (selection.rangeCount === 0) return;
    
    const range = selection.getRangeAt(0);
    const textContent = this.targetElement.textContent;
    const cursorPosition = this.getCursorPosition();
    
    // Find the last @ symbol before cursor
    const beforeCursor = textContent.substring(0, cursorPosition);
    const lastAtIndex = beforeCursor.lastIndexOf('@');
    
    if (lastAtIndex === -1) {
      this.hide();
      return;
    }
    
    // Check if there's a space between @ and cursor (which would end the mention)
    const afterAt = beforeCursor.substring(lastAtIndex + 1);
    if (afterAt.includes(' ') || afterAt.includes('\n')) {
      this.hide();
      return;
    }
    
    // Check if @ is at start or preceded by whitespace
    const charBeforeAt = lastAtIndex > 0 ? beforeCursor[lastAtIndex - 1] : ' ';
    if (charBeforeAt !== ' ' && charBeforeAt !== '\n' && lastAtIndex !== 0) {
      this.hide();
      return;
    }
    
    this.mentionStartIndex = lastAtIndex;
    this.searchTerm = afterAt;
    this.updatePosition();
    this.filterAndShow();
  }
  
  handleKeyDown(e) {
    if (!this.isVisible) return;
    
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        this.selectedIndex = Math.min(this.selectedIndex + 1, this.filteredItems.length - 1);
        this.updateSelection();
        break;
        
      case 'ArrowUp':
        e.preventDefault();
        this.selectedIndex = Math.max(this.selectedIndex - 1, 0);
        this.updateSelection();
        break;
        
      case 'Enter':
      case 'Tab':
        e.preventDefault();
        this.selectMention(this.selectedIndex);
        break;
        
      case 'Escape':
        e.preventDefault();
        this.hide();
        break;
    }
  }
  
  getCursorPosition() {
    const selection = window.getSelection();
    if (selection.rangeCount === 0) return 0;
    
    const range = selection.getRangeAt(0);
    const preCaretRange = range.cloneRange();
    preCaretRange.selectNodeContents(this.targetElement);
    preCaretRange.setEnd(range.endContainer, range.endOffset);
    
    return preCaretRange.toString().length;
  }
  
  updatePosition() {
    if (!this.targetElement) return;
    
    const selection = window.getSelection();
    if (selection.rangeCount === 0) return;
    
    const range = selection.getRangeAt(0);
    const rect = range.getBoundingClientRect();
    const targetRect = this.targetElement.getBoundingClientRect();
    
    // Position below the cursor
    this.style.left = `${rect.left}px`;
    this.style.top = `${rect.bottom + 5}px`;
    
    // Adjust if going off screen
    const pickerRect = this.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    
    if (rect.left + pickerRect.width > viewportWidth) {
      this.style.left = `${viewportWidth - pickerRect.width - 10}px`;
    }
    
    if (rect.bottom + pickerRect.height > viewportHeight) {
      this.style.top = `${rect.top - pickerRect.height - 5}px`;
    }
  }
  
  filterAndShow() {
    this.filteredItems = this.mentionItems.filter(item =>
      item.name.toLowerCase().includes(this.searchTerm.toLowerCase())
    );
    
    this.selectedIndex = 0;
    this.render();
    this.show();
  }
  
  render() {
    if (this.filteredItems.length === 0) {
      this.mentionList.innerHTML = `
        <div class="no-results">No matches found</div>
      `;
      return;
    }
    
    this.mentionList.innerHTML = this.filteredItems
      .map((item, index) => `
        <button class="mention-item ${index === this.selectedIndex ? 'selected' : ''}" 
                data-index="${index}" 
                type="button">
          <div class="mention-avatar">${item.avatar}</div>
          <div class="mention-info">
            <div class="mention-name">${this.highlightMatch(item.name)}</div>
            <div class="mention-title">${item.title}</div>
          </div>
        </button>
      `).join('');
  }
  
  highlightMatch(text) {
    if (!this.searchTerm) return text;
    
    const regex = new RegExp(`(${this.searchTerm})`, 'gi');
    return text.replace(regex, '<span class="highlight">$1</span>');
  }
  
  updateSelection() {
    const items = this.mentionList.querySelectorAll('.mention-item');
    items.forEach((item, index) => {
      item.classList.toggle('selected', index === this.selectedIndex);
    });
    
    // Scroll selected item into view
    const selectedItem = items[this.selectedIndex];
    if (selectedItem) {
      selectedItem.scrollIntoView({ 
        block: 'nearest',
        behavior: 'smooth'
      });
    }
  }
  
  selectMention(index) {
    if (index < 0 || index >= this.filteredItems.length) return;
    
    const selectedItem = this.filteredItems[index];
    this.insertMention(selectedItem);
    this.hide();
    
    // Dispatch custom event
    this.dispatchEvent(new CustomEvent('mention-selected', {
      detail: { 
        item: selectedItem,
        searchTerm: this.searchTerm
      },
      bubbles: true
    }));
  }
  
  insertMention(item) {
    if (!this.targetElement) return;
    
    const selection = window.getSelection();
    if (selection.rangeCount === 0) return;
    
    // Create mention element
    const mentionElement = document.createElement('span');
    mentionElement.contentEditable = false;
    mentionElement.className = 'mention';
    mentionElement.dataset.id = item.id;
    mentionElement.dataset.name = item.name;
    mentionElement.style.cssText = `
      background: #e3f2fd;
      color: #1976d2;
      padding: 2px 6px;
      border-radius: 12px;
      font-weight: 500;
      margin: 0 2px;
      display: inline-block;
    `;
    mentionElement.textContent = `@${item.name}`;
    
    // Find the range that contains the @mention text to replace
    const range = this.createRangeForMentionReplacement();
    if (!range) return;
    
    // Delete the @mention text (preserves surrounding markup)
    range.deleteContents();
    
    // Insert the mention element at the cursor position
    range.insertNode(mentionElement);
    
    // Add space after mention if needed
    const needsSpaceAfter = this.needsSpaceAfter(mentionElement);
    if (needsSpaceAfter) {
      const spaceAfter = document.createTextNode(' ');
      range.setStartAfter(mentionElement);
      range.insertNode(spaceAfter);
      
      // Set cursor after the space
      range.setStartAfter(spaceAfter);
    } else {
      // Set cursor after the mention
      range.setStartAfter(mentionElement);
    }
    
    range.collapse(true);
    selection.removeAllRanges();
    selection.addRange(range);
    
    this.targetElement.focus();
  }
  
  createRangeForMentionReplacement() {
    const selection = window.getSelection();
    if (selection.rangeCount === 0) return null;
    
    const currentRange = selection.getRangeAt(0);
    const walker = document.createTreeWalker(
      this.targetElement,
      NodeFilter.SHOW_TEXT,
      null,
      false
    );
    
    let textOffset = 0;
    let startNode = null;
    let endNode = null;
    let startOffset = 0;
    let endOffset = 0;
    
    // Find the text nodes that contain our mention text
    let node;
    while (node = walker.nextNode()) {
      const nodeLength = node.textContent.length;
      
      if (textOffset <= this.mentionStartIndex && textOffset + nodeLength > this.mentionStartIndex) {
        startNode = node;
        startOffset = this.mentionStartIndex - textOffset;
      }
      
      const mentionEndIndex = this.mentionStartIndex + this.searchTerm.length + 1; // +1 for @
      if (textOffset < mentionEndIndex && textOffset + nodeLength >= mentionEndIndex) {
        endNode = node;
        endOffset = mentionEndIndex - textOffset;
        break;
      }
      
      textOffset += nodeLength;
    }
    
    if (!startNode || !endNode) return null;
    
    const range = document.createRange();
    range.setStart(startNode, startOffset);
    range.setEnd(endNode, endOffset);
    
    return range;
  }
  
  needsSpaceAfter(mentionElement) {
    const nextSibling = mentionElement.nextSibling;
    if (!nextSibling) return true;
    
    if (nextSibling.nodeType === Node.TEXT_NODE) {
      const text = nextSibling.textContent;
      return text.length > 0 && text[0] !== ' ' && text[0] !== '\n';
    }
    
    return true;
  }
  
  show() {
    this.isVisible = true;
    this.setAttribute('visible', '');
  }
  
  hide() {
    this.isVisible = false;
    this.removeAttribute('visible');
  }
  
  // Public API methods
  setMentionItems(items) {
    this.mentionItems = items;
  }
  
  addMentionItem(item) {
    this.mentionItems.push(item);
  }
  
  getMentions() {
    if (!this.targetElement) return [];
    
    const mentions = this.targetElement.querySelectorAll('.mention');
    return Array.from(mentions).map(mention => ({
      id: mention.dataset.id,
      name: mention.dataset.name,
      element: mention
    }));
  }
  
  // Static method to create and attach
  static attachTo(element, mentionItems = null) {
    const picker = new MentionPicker();
    if (mentionItems) {
      picker.setMentionItems(mentionItems);
    }
    picker.attachTo(element);
    return picker;
  }
}

// Register the custom element
customElements.define('mention-picker', MentionPicker);
