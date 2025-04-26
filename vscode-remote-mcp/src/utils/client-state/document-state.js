/**
 * Document Collaboration State for VSCode Remote MCP
 * 
 * This module manages the state transitions for document collaboration.
 */

const BaseState = require('./base-state');
const { DocumentState } = require('./state-constants');

/**
 * Document Collaboration State class
 * Manages the state transitions for document collaboration
 */
class DocumentCollaborationState extends BaseState {
  /**
   * Create a new DocumentCollaborationState instance
   */
  constructor() {
    super(DocumentState.NO_DOCUMENT);
    this.documentUri = null;
    this.currentEdit = null;
  }

  /**
   * Get the document URI
   * @returns {string|null} The document URI
   */
  getDocumentUri() {
    return this.documentUri;
  }

  /**
   * Get the current edit
   * @returns {Object|null} The current edit
   */
  getCurrentEdit() {
    return this.currentEdit;
  }

  /**
   * Validate if a transition is allowed
   * @param {string} fromState - The state to transition from
   * @param {string} toState - The state to transition to
   * @throws {Error} If the transition is not allowed
   * @private
   */
  _validateTransition(fromState, toState) {
    const allowedTransitions = {
      [DocumentState.NO_DOCUMENT]: [DocumentState.ACTIVE],
      [DocumentState.ACTIVE]: [DocumentState.EDITING, DocumentState.NO_DOCUMENT],
      [DocumentState.EDITING]: [DocumentState.ACTIVE, DocumentState.NO_DOCUMENT]
    };

    super._validateTransition(fromState, toState, allowedTransitions);
  }

  /**
   * Open a document
   * @param {string} documentUri - The document URI
   * @throws {Error} If not in a valid state to open a document
   */
  openDocument(documentUri) {
    this._validateTransition(this.currentState, DocumentState.ACTIVE);
    this.documentUri = documentUri;
    this._transitionTo(DocumentState.ACTIVE);
  }

  /**
   * Make an edit to the document
   * @param {Object} edit - The edit to make
   * @throws {Error} If not in a valid state to make an edit
   */
  makeEdit(edit) {
    if (this.currentState !== DocumentState.ACTIVE) {
      throw new Error(`Cannot make edit in state: ${this.currentState}`);
    }
    this._validateTransition(this.currentState, DocumentState.EDITING);
    this.currentEdit = edit;
    this._transitionTo(DocumentState.EDITING);
  }

  /**
   * Complete the current edit
   * @throws {Error} If not in a valid state to complete an edit
   */
  editComplete() {
    if (this.currentState !== DocumentState.EDITING) {
      throw new Error(`Cannot complete edit in state: ${this.currentState}`);
    }
    this._validateTransition(this.currentState, DocumentState.ACTIVE);
    this.currentEdit = null;
    this._transitionTo(DocumentState.ACTIVE);
  }

  /**
   * Close the document
   * @throws {Error} If not in a valid state to close a document
   */
  closeDocument() {
    if (this.currentState === DocumentState.NO_DOCUMENT) {
      throw new Error(`Cannot close document in state: ${this.currentState}`);
    }
    this._validateTransition(this.currentState, DocumentState.NO_DOCUMENT);
    this.documentUri = null;
    this.currentEdit = null;
    this._transitionTo(DocumentState.NO_DOCUMENT);
  }

  /**
   * Reset the document state
   */
  reset() {
    super.reset(DocumentState.NO_DOCUMENT);
    this.documentUri = null;
    this.currentEdit = null;
  }
}

module.exports = DocumentCollaborationState;