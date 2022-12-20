class Widget {
  // checks if a list contains any widgets
  static containsWidgets(list) {
    for (var item of list) {
      if (item instanceof Widget) {
        return true;
      }
    }
    return false;
  }

  // emits a widget result if the item is a Widget, otherwise returns the item
  static render(item) {
    var text = '';
    if (item instanceof Widget) {
      text += item.emit();
    } else {
      text += item;
    }
    return text;
  }

  // combines input parameters during class construction
  static setParams(child, self) {
    for (var param in child) {
      self[param] = child[param];
    }
    return self;
  }

  validateParameters() {
    // make sure all required parameters are provided
    for (var required in this.inputParameters) {
      if (this.inputParameters[required] === undefined && !(required in this.parameters)) {
        throw new Error(`Required parameter "${required}" not provided.`);
      }
    }

    // make sure all provided parameters are valid
    for (var parameter in this.parameters) {
      if (!(parameter in this.inputParameters)) {
        console.log(this.parameters, this.inputParameters);
        throw new Error(`"${parameter}" is not a valid parameter.`);
      }
    }
  }

  getParam(name) {
    if (name in this.parameters) {
      return this.parameters[name];
    } else if (name in this.inputParameters) {
      return this.inputParameters[name];
    } else {
      throw new Error(`Trying to get invalid parameter "${name}".`);
    }
  }

  build() {
    throw new Error("Must override `build` method.");
  }

  emit() {
    throw new Error("Must override `emit` method.");
  }

  constructor(name, parameters, /* internal */ inputParameters = {}) {
    this.name = name;
    this.parameters = parameters;
    this.inputParameters = Widget.setParams(inputParameters, {
      "description": undefined
    });
    this.validateParameters()
  }
}

class WidgetContainer extends Widget {
  constructor(name, parameters, subwidgets, /* internal */ inputParameters = {}) {
    super(name, parameters, Widget.setParams(inputParameters, {}));
    this.subwidgets = subwidgets;
    this.hassubcontrols = Widget.containsWidgets(subwidgets);
  }

  emit() {
    var text = ''
    for (var widget of this.subwidgets) {
      text += Widget.render(widget);
    }
    return text;
  }
}

class BlockToggle extends WidgetContainer {
  constructor(name, parameters, subwidgets, /* internal */ inputParameters = {}) {
    // set up inputParameters
    super(name, parameters, subwidgets, Widget.setParams(inputParameters, {
      "selected": true
    }));

    this.state = this.getParam("selected");
    this.description = this.getParam("description");
  }

  build() {
    var check = $('<input />', { type: 'checkbox' })
      .prop('checked', this.state)
      .on("change", (e) => {
        this.state = e.target.checked;
      })
    return $('<label/>').append(check).append(this.description);
  }

  emit() {
    return this.state ? super.emit() : '';
  }
}

class Slider extends Widget {
  constructor(name, parameters, /* internal */ inputParameters = {}) {
    // set up inputParameters
    super(name, parameters, Widget.setParams(inputParameters, {
      "value": undefined,
      "min": undefined,
      "max": undefined,
      "step": 1
    }));

    this.value = this.getParam("value");
    this.min = this.getParam("min");
    this.max = this.getParam("max");
    this.step = this.getParam("step");
    this.description = this.getParam("description");
  }

  build() {
    var slider = $('<input />', { type: 'range', min: this.min, max: this.max, value: this.value, step: this.step })
      .on("change", (e) => {
        this.value = $(e.target).val();
      })
    return $('<label/>').append(slider).append(this.description);
  }

  emit() {
    return this.value;
  }
}



class InputWizard extends WidgetContainer {
  updateText() {
    console.log(this.emit());
  }

  constructor(name, parameters, subwidgets, /* internal */ inputParameters = {}) {
    super(name, parameters, subwidgets, Widget.setParams(inputParameters, {
      "form_node": undefined
    }));

    // construct the HTML for all widgets
    this.form_node = this.getParam("form_node");
    this.form_node.append(super.build());

    // register an update handler for all widgets
    this.form_node.on("change", () => { this.updateText(); });

    // render initial input
    window.setTimeout(() => { this.updateText(); }, 0);
  }
}

class DemoWizard extends InputWizard {
  updateText() {
    this.textarea_node.val(this.emit());
  }

  constructor(name, parameters, subwidgets, /* internal */ inputParameters = {}) {
    super(name, parameters, subwidgets, Widget.setParams(inputParameters, {
      "textarea_node": undefined
    }));

    this.textarea_node = this.getParam("textarea_node");
  }
}

var wizard = new DemoWizard('demo_form', {
  description: "Demonstration wizard",
  form_node: $('body'),
  textarea_node: $('#inputtext')
},
  [
    `
  global = `, new Slider('global', { description: 'Global parameter', min: 10, max: 30, value: 20 }), `

  [Mesh]
    file = myfile.e
  []

  [Variables]
    [u]
    []
  []
  `,
    new BlockToggle("bc", { "description": "Apply a Dirichlet boundary condition", "selected": false }, [
      `
  [BCs]
    [my_bc]
      type = DirichletBC
      variable = u
      value = 0
    []
  []
  `]),
    new BlockToggle("ic", { "description": "Constant initial condition", "selected": true }, [`
  [ICs]
    [my_bc]
      type = ConstantIC
      variable = u
      value = `, new Slider('bcval', { description: 'BC Value', min: 00, max: 1, value: 0.1 }), `
    []
  []
  `]),
    `
  [Executioner]
    type = Steady
  []
  `
  ]);

// var wizard = new DemoWizard($('body'), [
//   `
//   [Mesh]
//   file = myfile.e
//   []

//   [Variables]
//   [u]
//   []
//   []
//   `,
//   new BlockToggle("bc", { "description": "Apply a Dirichlet boundary condition", "selected": false }, [`
//   [BCs]
//   [my_bc]
//   type = DirichletBC
//   variable = u
//   value = 0
//   []
//   []
//   `]),
//   new BlockToggle("ic", { "description": "Constant initial condition", "selected": true }, [`
//   [ICs]
//   [my_bc]
//   type = ConstantIC
//   variable = u
//   value = `, new Slider('bcval', { description: '' }), `
//   []
//   []
//   `]),
//   `
//   [Executioner]
//   type = Steady
//   []
//   `
// ]);

