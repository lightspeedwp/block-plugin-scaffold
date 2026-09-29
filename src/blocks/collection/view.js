/**
 * Frontend view script for the {{cpt_slug|kebabCase}}-collection block
 * Handles DOM events and extensibility hooks.
 */
(function() {
  const blockSelector = '.wp-block-{{slug}}-{{cpt_slug|kebabCase}}-collection';

  function triggerEvent(element, eventName, detail = {}) {
    const event = new CustomEvent(eventName, { detail, bubbles: true });
    element.dispatchEvent(event);
  }

  function initCollectionBlock(block) {
    // Example: trigger collectionInit event
    triggerEvent(block, 'collectionInit', { block });

    // Example: listen for filter changes
    block.addEventListener('collectionFilter', (e) => {
      // Custom extensibility point
      if (window.{{namespace}}CollectionFilterHandler) {
        window.{{namespace}}CollectionFilterHandler(e.detail, block);
      }
    });
    // Add more event listeners as needed for extensibility
  }

  document.addEventListener('DOMContentLoaded', function() {
    document.querySelectorAll(blockSelector).forEach(initCollectionBlock);
  });
})();
