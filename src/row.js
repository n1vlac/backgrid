/*
  backgrid
  http://github.com/wyuenho/backgrid

  Copyright (c) 2013 Jimmy Yuen Ho Wong
  Licensed under the MIT @license.
*/

/**
   Row is a simple container view that takes a model instance and a list of
   column metadata describing how each of the model's attribute is to be
   rendered, and apply the appropriate cell to each attribute.

   @class Backgrid.Row
   @extends Backbone.View
 */
var Row = Backgrid.Row = Backbone.View.extend({

  /** @property */
  tagName: "tr",

  /**
     Initializes a row view instance.

     @param {Object} options
     @param {Backbone.Collection.<Backgrid.Column>|Array.<Backgrid.Column>|Array.<Object>} options.columns Column metadata.
     @param {Backbone.Model} options.model The model instance to render.

     @throws {TypeError} If options.columns or options.model is undefined.
   */
  initialize: function (options) {

    requireOptions(options, ["columns", "model"]);

    var columns = this.columns = options.columns;
    if (!(columns instanceof Backbone.Collection)) {
      columns = this.columns = new Columns(columns);
    }
    this.listenTo(columns, "change:renderable", this.renderColumn);

    var cells = this.cells = [];
    for (var i = 0; i < columns.length; i++) {
      var column = columns.at(i);
      cells.push(new (column.get("cell"))({
        column: column,
        model: this.model
      }));
    }

    this.listenTo(columns, "add", function (column, columns, options) {
      options = _.defaults(options || {}, {render: true});
      var at = columns.indexOf(column);
      var cell = new (column.get("cell"))({
        column: column,
        model: this.model
      });
      cells.splice(at, 0, cell);
      this.renderColumn(column, column.get("renderable") && options.render);
    });
    this.listenTo(columns, "remove", function (column) {
      this.renderColumn(column, false);
    });
  },

  /**
     Backbone event handler. Insert a table cell to the right column in the row
     if renderable is true, detach otherwise.

     @param {Backgrid.Column} column
     @param {boolean} renderable
   */
  renderColumn: function (column, renderable) {
    var cells = this.cells;
    var columns = this.columns;
    var spliceIndex = -1;
    for (var i = 0; i < cells.length; i++) {
      var cell = cells[i];
      if (cell.column.get("name") == column.get("name")) {
        spliceIndex = i;
        break;
      }
    }
    if (spliceIndex != -1) {
      var $el = this.$el;
      if (renderable) {
        var cell = cells[spliceIndex];
        if (spliceIndex === 0) {
          $el.prepend(cell.render().$el);
        }
        else if (spliceIndex === columns.length - 1) {
          $el.append(cell.render().$el);
        }
        else {
          $el.children().eq(spliceIndex).before(cell.render().$el);
        }
      }
      else {
        $el.children().eq(spliceIndex).detach();
      }
    }
  },

  /**
     Renders a row of cells for this row's model.
   */
  render: function () {
    this.$el.empty();

    var fragment = document.createDocumentFragment();

    for (var i = 0; i < this.cells.length; i++) {
      var cell = this.cells[i];
      if (cell.column.get("renderable")) {
        fragment.appendChild(cell.render().el);
      }
    }

    this.el.appendChild(fragment);

    return this;
  },

  /**
     Clean up this row and its cells.

     @chainable
   */
  remove: function () {
    for (var i = 0; i < this.cells.length; i++) {
      var cell = this.cells[i];
      cell.remove.apply(cell, arguments);
    }
    return Backbone.View.prototype.remove.apply(this, arguments);
  }

});
