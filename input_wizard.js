class Widget {
  // checks if a list contains any widgets
  static containsWidgets(list) {
    for (item of list) {
      if (iotem instanceof Widget) {
        return true;
      }
    }
    return false;
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
      throw new Error(`Trying to get invalid parameter "${parameter}".`);
    }
  }

  build() {
    return $('<p>Widget base class</p>');
  }

  emit() {
    throw new Error("Must override `emit` method.");
  }

  constructor(name, parameters, text, /* internal */ inputParameters = {}) {
    this.text = text;
    this.name = name;
    this.parameters = parameters;
    this.inputParameters = Widget.setParams(inputParameters, {
      "description": undefined
    });
    this.validateParameters()
  }
}

class BlockToggle extends Widget {
  constructor(name, parameters, text, /* internal */ inputParameters = {}) {
    // set up inputParameters
    super(name, parameters, text, Widget.setParams(inputParameters, {
      "description": undefined,
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
    return this.state ? this.text : '';
  }
}

class Slider extends Widget {
  constructor(name, parameters, text, /* internal */ inputParameters = {}) {
    // set up inputParameters
    super(name, parameters, text, Widget.setParams(inputParameters, {
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



class InputWizard {
  updateText() {
    console.log('updating');
    this.text = '';
    for (var widget of this.widgets) {
      if (widget instanceof Widget) {
        this.text += widget.emit();
      } else {
        this.text += widget;
      }
    }
  }

  constructor(node, widgets) {
    this.widgets = widgets;

    // construct the HTML for all widgets
    for (var widget of this.widgets) {
      if (widget instanceof Widget) {
        node.append($('<p/>').append(widget.build()));
      }
    }

    // register an update handler for all widgets
    node.on("change", () => { this.updateText(); });

    // add generate button

    // render initial input
    window.setTimeout(() => { this.updateText(); }, 0);
  }
}

class DemoWizard extends InputWizard {
  constructor(node, widgets) { super(node, widgets); }
  updateText() {
    super.updateText();
    $('#inputtext').val(this.text);
  }
}

var wizard = new DemoWizard($('body'), [
  `
  global = `, new Slider('bcval', { description: 'Global parameter', min: 10, max: 30, value: 20 }), `

  [Mesh]
    file = myfile.e
  []

  [Variables]
    [u]
    []
  []
  `,
  new BlockToggle("bc", { "description": "Apply a Dirichlet boundary condition", "selected": false }, `
  [BCs]
    [my_bc]
      type = DirichletBC
      variable = u
      value = 0
    []
  []
  `),
  new BlockToggle("ic", { "description": "Constant initial condition", "selected": true }, `
  [ICs]
    [my_bc]
      type = ConstantIC
      variable = u
      value = 0
    []
  []
  `),
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

