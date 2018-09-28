import d from '/!/@shopify/draggable';
import Vue from '/~/vue';

// Basic variables
const draggableAttribute = 'data-draggable';
const nodragTest = e => e.data.sensorEvent.data.target.tagName.match(/input|textarea|button|select/i);

// Draggable, if we're on the client side
const draggable = d.Draggable && new d.Draggable([], {
  draggable: `[${draggableAttribute}]`
});

export const dragBus = new Vue();

// Set up callbacks
const dragSourceValues = new WeakMap();
const dropCallbacks = new WeakMap();

const registerDropCallback = function (el, cb) {
  draggable.addContainer(el);
  dropCallbacks.set(el, cb);
}

const removeDropCallback = function (el) {
  draggable.removeContainer(el);
  dropCallbacks.delete(el);
}

const addDraggable = function (el, value) {
  el.setAttribute(draggableAttribute, '');
  dragSourceValues.set(el, value);
}

// Set up communications between containers
if (draggable) {
  let dragOver = null;
  let overContainer = null;

  // Drag starts, but not on form elements
  draggable.on('drag:start', e => {
    if (nodragTest(e)) {
      e.cancel();
      return;
    }

    // Alert any listeners to the drag starting
    dragBus.$emit('dragstart');
  });

  // Lets us compare dragged element's position to another draggable
  draggable.on('drag:over', e => {
    dragOver = e.data.over;
  });
  draggable.on('drag:out', e => {
    dragOver = null;
  });


  // Let us detect which container we're dropping into
  draggable.on('drag:over:container', e => {
    overContainer = e.overContainer;
  });
  draggable.on('drag:out:container', e => {
    overContainer = null;
  });

  // When drag finishes, fire the drop event in the relevant container
  // with the dropped-over element as second argument to allow sorting, swapping, etc
  draggable.on('drag:stop', e => {
    const container = overContainer || e.data.sourceContainer;
    const over = dragOver && dragSourceValues.get(dragOver);
    const source = dragSourceValues.get(e.data.originalSource);
    const cb = dropCallbacks.get(container);

    // Fire any stop callbacks
    dragBus.$emit('dragend');

    // Fire drop container callback
    if(cb) {
      cb(source, over);
    }
  });
}

// Create directives for draggable and drop target elements
export const directives = {
  // Takes a callback that receives drag source value and dropped-on value, if there is one
  dropTarget: {
    bind(el, binding){
      registerDropCallback(el, binding.value);
    },
    unbind(el){
      removeDropCallback(el);
    }
  },
  // Takes a value that is passed to the drop target callback
  // Must be used inside a drop target
  draggable(el, binding) {
    addDraggable(el, binding.value);
  }
}

// Mixins for drag container, drop target
const event = 'over',
      prop = 'value';

export const mixins = {
  dropTarget: {
    directives: {
      draggable: directives.draggable
    },
    mounted() {
      registerDropCallback(this.$el, (...args) => this.$emit(event, args));
    },
    beforeUnmount() {
      removeDropCallback(this.$el)
    }
  },
  draggable: {
    props: [prop],
    mounted() {
      addDraggable(this.$el, this[prop]);
    }
  }
}
