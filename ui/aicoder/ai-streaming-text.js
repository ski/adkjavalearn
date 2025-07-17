class AIStreamingText extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.currentText = '';
    this.isStreaming = false;
    this.streamingSpeed = 30; // milliseconds between characters
    this.md = null; // To hold the markdown-it instance
    this._markdownWarning = false;
    this.queue = [];
    
    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          line-height: 1.6;
          color: #333;
          background: #f8f9fa;
          border-radius: 12px;
          padding: 20px;
          margin: 10px 0;
          box-shadow: 0 2px 10px rgba(0,0,0,0.1);
          position: relative;
          overflow: hidden;
        }
        
        .ai-message {
          margin: 0;
          font-size: 15px;
          white-space: pre-wrap;
          word-wrap: break-word;
        }
        
        .typing-indicator {
          display: inline-block;
          width: 8px;
          height: 20px;
          background: #667eea;
          margin-left: 2px;
          animation: blink 1s infinite;
          border-radius: 1px;
        }
        
        .ai-avatar {
          position: absolute;
          top: -5px;
          left: -5px;
          width: 24px;
          height: 24px;
          background: linear-gradient(45deg, #667eea, #764ba2);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 12px;
          color: white;
          font-weight: bold;
          box-shadow: 0 2px 6px rgba(0,0,0,0.2);
        }
        
        .streaming-glow {
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(102, 126, 234, 0.1), transparent);
          animation: streaming 2s infinite;
          pointer-events: none;
        }
        
        /* Markdown-like styling */
        .message-content strong {
          font-weight: 600;
          color: #2c3e50;
        }
        
        .message-content em {
          font-style: italic;
          color: #555;
        }
        
        .message-content code {
          background: #e9ecef;
          padding: 2px 6px;
          border-radius: 4px;
          font-family: 'Courier New', monospace;
          font-size: 0.9em;
          color: #d63384;
        }
        
        .message-content pre {
          background: #2d3748;
          color: #e2e8f0;
          padding: 16px;
          border-radius: 8px;
          overflow-x: auto;
          margin: 12px 0;
          font-family: 'Courier New', monospace;
          font-size: 0.9em;
          line-height: 1.4;
        }
        
        .message-content ul, .message-content ol {
          margin: 12px 0;
          padding-left: 24px;
        }
        
        .message-content li {
          margin: 4px 0;
        }
        
        .message-content h1, .message-content h2, .message-content h3 {
          color: #2c3e50;
          margin: 16px 0 8px 0;
          font-weight: 600;
        }
        
        .message-content h1 { font-size: 1.5em; }
        .message-content h2 { font-size: 1.3em; }
        .message-content h3 { font-size: 1.1em; }
        
        .message-content blockquote {
          border-left: 4px solid #667eea;
          padding-left: 16px;
          margin: 12px 0;
          color: #666;
          font-style: italic;
        }
        
        .message-content a {
          color: #667eea;
          text-decoration: none;
        }
        
        .message-content a:hover {
          text-decoration: underline;
        }
        
        @keyframes blink {
          0%, 50% { opacity: 1; }
          51%, 100% { opacity: 0; }
        }
        
        @keyframes streaming {
          0% { left: -100%; }
          100% { left: 100%; }
        }
        
        .fade-in {
          animation: fadeIn 0.3s ease-in;
        }
        
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        /* Status indicators */
        .status-thinking {
          color: #6c757d;
          font-style: italic;
          opacity: 0.8;
        }
        
        .status-complete {
          border-left: 3px solid #28a745;
        }
        
        .status-error {
          border-left: 3px solid #dc3545;
          background: #fff5f5;
        }
      </style>
      
      <div class="ai-avatar">AI</div>
      <div class="streaming-glow"></div>
      <div class="message-content">
        <div class="ai-message"></div>
        <span class="typing-indicator" style="display: none;"></span>
      </div>
    `;
    
    this.messageElement = this.shadowRoot.querySelector('.ai-message');
    this.typingIndicator = this.shadowRoot.querySelector('.typing-indicator');
    this.streamingGlow = this.shadowRoot.querySelector('.streaming-glow');
    this.contentElement = this.shadowRoot.querySelector('.message-content');
  }
  
  // Start streaming text with typing effect
  startStreaming(text, options = {}) {
    this.streamingSpeed = options.speed || 30;
    this.queue = [];
    this.currentText = '';
    this.isStreaming = true;
    
    // Show streaming effects
    this.typingIndicator.style.display = 'inline-block';
    this.streamingGlow.style.display = 'block';
    this.classList.add('fade-in');
    
    // Add text to queue for streaming
    this.queue = text.split('');
    this.processQueue();
  }
  
  // Process the character queue with typing animation
  processQueue() {
    if (this.queue.length === 0) {
      this.finishStreaming();
      return;
    }
    
    const char = this.queue.shift();
    this.currentText += char;
    this.updateDisplay();
    
    setTimeout(() => {
      if (this.isStreaming) {
        this.processQueue();
      }
    }, this.streamingSpeed);
  }
  
  // Update the display with current text
  updateDisplay() {
    this.messageElement.innerHTML = this.formatText(this.currentText);
    this.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }
  
  // Finish streaming animation
  finishStreaming() {
    this.isStreaming = false;
    this.typingIndicator.style.display = 'none';
    this.streamingGlow.style.display = 'none';
    this.classList.add('status-complete');
    
    // Dispatch completion event
    this.dispatchEvent(new CustomEvent('streaming-complete', {
      detail: { text: this.currentText }
    }));
  }
  
  // Stop streaming immediately
  stopStreaming() {
    this.isStreaming = false;
    this.queue = [];
    this.finishStreaming();
  }
  
  // Append text to existing content (for real-time streaming)
  appendText(newText) {
    if (!this.isStreaming) {
      this.startStreaming(this.currentText + newText);
    } else {
      // Add to queue if currently streaming
      this.queue.push(...newText.split(''));
    }
  }
  
  // Set text instantly without streaming
  setText(text) {
    this.stopStreaming();
    this.currentText = text;
    this.messageElement.innerHTML = this.formatText(text);
  }
  
  // Clear all content
  clear() {
    this.stopStreaming();
    this.currentText = '';
    this.messageElement.innerHTML = '';
    this.classList.remove('status-complete', 'status-error');
  }
  
  // Show thinking/loading state
  showThinking(message = 'AI is thinking...') {
    this.clear();
    this.messageElement.innerHTML = `<span class="status-thinking">${message}</span>`;
    this.typingIndicator.style.display = 'inline-block';
    this.streamingGlow.style.display = 'block';
  }
  
  // Show error state
  showError(message = 'An error occurred') {
    this.stopStreaming();
    this.classList.add('status-error');
    this.messageElement.innerHTML = `<strong>Error:</strong> ${message}`;
  }
  
  // Basic markdown-like formatting
  formatText(text) {
    // Lazily initialize markdown-it on first run if it's available
    if (!this.md && typeof window.markdownit !== 'undefined') {
      this.md = window.markdownit({
        html: false,        // Disable HTML tags in source for security
        linkify: true,      // Autoconvert URL-like text to links
        typographer: true,  // Enable smartquotes and other typographic replacements
        breaks: true        // Convert '\n' in paragraphs into <br>
      });
    }

    if (this.md) {
      return this.md.render(text);
    }

    // Fallback if markdown-it is not available
    if (!this._markdownWarning) {
      console.warn('markdown-it.js library not loaded. Falling back to basic formatting. For full Markdown support, please include the library.');
      this._markdownWarning = true; // Prevent logging this warning repeatedly
    }
    
    // Basic, safe fallback to prevent errors and render text readably.
    // Escapes basic HTML and converts newlines to <br>.
    const escapedText = text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    return escapedText.replace(/\n/g, '<br>');
  }
  
  // Attribute change handling
  static get observedAttributes() {
    return ['speed', 'avatar-text', 'theme'];
  }
  
  attributeChangedCallback(name, oldValue, newValue) {
    switch (name) {
      case 'speed':
        this.streamingSpeed = parseInt(newValue) || 30;
        break;
      case 'avatar-text':
        this.shadowRoot.querySelector('.ai-avatar').textContent = newValue || 'AI';
        break;
      case 'theme':
        this.applyTheme(newValue);
        break;
    }
  }
  
  // Apply different themes
  applyTheme(theme) {
    const styles = this.shadowRoot.querySelector('style');
    switch (theme) {
      case 'dark':
        this.style.background = '#2d3748';
        this.style.color = '#e2e8f0';
        break;
      case 'minimal':
        this.style.background = 'transparent';
        this.style.boxShadow = 'none';
        this.style.border = '1px solid #e2e8f0';
        break;
      default:
        // Reset to default theme
        this.style.background = '#f8f9fa';
        this.style.color = '#333';
        this.style.boxShadow = '0 2px 10px rgba(0,0,0,0.1)';
        break;
    }
  }
}

// Register the custom element
customElements.define('ai-streaming-text', AIStreamingText);
