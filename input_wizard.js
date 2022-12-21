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

  find(name) {
    return this.wizard.findInternal(name);
  }

  findInternal(name) {
    if (name === this.name) {
      return this;
    } else {
      return undefined;
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

  // puts a frame around the widget dom node
  frame(node) {
    return $('<div class="widget"/>').append(node);
  }

  build() {
    throw new Error("Must override `build` method.");
  }

  emit() {
    throw new Error("Must override `emit` method.");
  }

  update() {
    if (this.changeHandler) {
      this.changeHandler(this);
    }
  }

  register(wizard) {
    this.wizard = wizard;
  }

  constructor(name, parameters, /* internal */ inputParameters = {}) {
    this.name = name;
    this.parameters = parameters;
    this.inputParameters = Widget.setParams(inputParameters, {
      "description": undefined,
      "change": null
    });
    this.validateParameters();

    this.description = this.getParam("description");
    this.changeHandler = this.getParam("change");
  }
}

class WidgetContainer extends Widget {
  constructor(name, parameters, subwidgets, /* internal */ inputParameters = {}) {
    super(name, parameters, Widget.setParams(inputParameters, {}));
    this.subwidgets = subwidgets;
    this.hassuboptions = Widget.containsWidgets(subwidgets);
  }

  findInternal(name) {
    if (name === this.name) {
      return this;
    } else {
      for (var widget of this.subwidgets) {
        if (widget instanceof Widget) {
          var found = widget.findInternal(name);
          if (found) { return found; }
        }
      }
      return undefined;
    }
  }

  forSubwidgets(apply) {
    for (var widget of this.subwidgets) {
      if (widget instanceof Widget) {
        apply(widget);
      }
    }
  }

  buildSubwidgets() {
    var list = [];
    this.forSubwidgets((widget) => { list.push(widget.build()); });
    return list;
  }

  build() {
    return this.frame(this.buildSubwidgets());
  }

  emit() {
    var text = ''
    for (var widget of this.subwidgets) {
      text += Widget.render(widget);
    }
    return text;
  }

  update() {
    super.update();
    this.forSubwidgets((widget) => { widget.update(); });
  }

  register(wizard) {
    super.register(wizard);
    this.forSubwidgets((widget) => { widget.register(wizard); });
  }
}

class HiddenBlockToggle extends WidgetContainer {
  constructor(name, parameters, subwidgets, /* internal */ inputParameters = {}) {
    // set up inputParameters
    super(name, parameters, subwidgets, Widget.setParams(inputParameters, {
      "selected": true
    }));

    this.state = this.getParam("selected");
  }

  build() {
    return undefined;
  }

  emit() {
    return this.state ? super.emit() : '';
  }
}

class BlockToggle extends HiddenBlockToggle {
  constructor(name, parameters, subwidgets, /* internal */ inputParameters = {}) {
    // set up inputParameters
    super(name, parameters, subwidgets, Widget.setParams(inputParameters, {}));
  }

  build() {
    this.suboptions = $('<span/>').append(this.buildSubwidgets());
    console.log(this.name, this.suboptions);

    var updateVisibility = () => {
      if (this.state) {
        this.suboptions.show(100);
      } else {
        this.suboptions.hide(100);
      }
    }

    var check = $('<input />', { type: 'checkbox' })
      .prop('checked', this.state)
      .on("change", (e) => {
        this.state = e.target.checked;
        updateVisibility();
      });
    var label = $('<label/>').append(check).append(this.description);
    updateVisibility();

    return this.frame([label, this.suboptions]);
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
  }

  build() {
    var slider = $('<input />', { type: 'range', min: this.min, max: this.max, value: this.value, step: this.step })
      .on("change", (e) => {
        this.value = $(e.target).val();
      })
    return this.frame($('<label/>').append(slider).append(this.description));
  }

  emit() {
    return this.value;
  }
}

class Select extends Widget {
  constructor(name, parameters, /* internal */ inputParameters = {}) {
    // set up inputParameters
    super(name, parameters, Widget.setParams(inputParameters, {
      "options": undefined,
      "default": 0
    }));

    this.options = this.getParam("options");
    this.index = this.getParam("default");
  }

  build() {
    var select = $('<select />').on("change", (e) => {
      this.index = $(e.target).val();
    })
    for (var item in this.options) {
      var option = $('<option/>', { value: item }).text(this.options[item]);
      select.append(option);
    }
    return this.frame($('<label/>').append(select).append(this.description));
  }

  emit() {
    return this.options[this.index];
  }
}



class InputWizard extends WidgetContainer {
  updateText() {
    console.log('InputWizard', this.emit());
  }

  constructor(name, parameters, subwidgets, /* internal */ inputParameters = {}) {
    super(name, parameters, subwidgets, Widget.setParams(inputParameters, {
      "form_node": undefined
    }));

    // construct the HTML for all widgets
    this.form_node = this.getParam("form_node");
    this.form_node.append(this.build());

    // register an update handler for all widgets
    this.form_node.on("change", () => { this.update(); this.updateText(); });

    // register all contained widgets to the wizard
    this.register(this);

    // render initial input
    window.setTimeout(() => { this.update(); this.updateText(); }, 0);
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

var global_slider = new Slider('global', { description: 'Global parameter', min: 10, max: 30, value: 20 });
var bc_slider = new Slider('bcval', { description: 'Dirichlet BC Value', min: 0, max: 1, value: 0.5, step: 0.1 });
var bc2_slider = new Slider('bcval2', { description: 'Neumann BC Value', min: 0, max: 1, value: 0, step: 0.1 });
var boundary_select = new Select('boundary', { description: 'Which boundary to apply the BC to', options: ['top', 'bottom', 'right'] });

var wizard = new DemoWizard('demo_form', {
  description: "Demonstration wizard",
  form_node: $('#wizard'),
  textarea_node: $('#inputtext')
},
  [
    `
  global = `, global_slider, `

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
      boundary = `, boundary_select, `
      value = 0
    []`,
      new BlockToggle("bc2", { "description": "Additional boundary condition", "selected": false, "change": (widget) => { widget.find("pp").state = widget.state; } }, [
        `
    [additional_bc]
      type = NeumannBC
      variable = u
      boundary = left
      value = `, bc2_slider, `
    []`])
      ,
      `
  []
  `]),
    new BlockToggle("ic", { "description": "Constant initial condition", "selected": true }, [`
  [ICs]
    [my_bc]
      type = ConstantIC
      variable = u
      value = `, bc_slider, `
    []
  []
  `]),
    `
  [Executioner]
    type = Steady
  []
  `,
    new HiddenBlockToggle("pp", { "description": "Postprocessor that is conditional on a different block toggle" }, [
      `
  [PostProcessors]
    [area]
      type = AreaPostprocessor
      boundary = surface
    []
  []
    `
    ])
  ]);
