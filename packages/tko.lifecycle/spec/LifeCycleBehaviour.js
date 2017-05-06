
import {LifeCycle} from '../index'

import {
    observable
} from 'tko.observable'

import {
    cleanNode
} from 'tko.utils'

// Polyfills needed.
import 'core-js/fn/object/assign'


describe('KO LifeCycle', function() {
  describe("mixInto", function () {
    it("extends a function prototype", function() {
      var fn;
      fn = function() {};
      LifeCycle.mixInto(fn);
      assert.isFunction(fn.prototype.subscribe);
      assert.isFunction(fn.prototype.computed);
      assert.isFunction(fn.prototype.addEventListener);
      assert.isFunction(fn.prototype.anchorTo);
      assert.isFunction(fn.prototype.dispose);
      assert.isFunction(fn.prototype.addDisposable);
      assert.isNotFunction(fn.prototype.mixInto);
    })

    it("adds to a constructed item", function() {
      var Ctr, instance;
      Ctr = function() {};
      instance = new Ctr();
      LifeCycle.mixInto(Ctr);
      assert.isFunction(instance.subscribe);
      assert.isFunction(instance.computed);
      assert.isFunction(instance.addEventListener);
      assert.isFunction(instance.anchorTo);
      assert.isFunction(instance.dispose);
      assert.isFunction(instance.addDisposable);
      assert.isNotFunction(instance.mixInto);
    })

    it("extends a class", function () {
      class Child extends LifeCycle {}
      assert.isFunction(Child.prototype.subscribe);
      assert.isFunction(Child.prototype.computed);
      assert.isFunction(Child.prototype.addEventListener);
      assert.isFunction(Child.prototype.anchorTo);
      assert.isFunction(Child.prototype.dispose);
      assert.isFunction(Child.prototype.addDisposable);
      assert.isNotFunction(Child.prototype.mixInto);
    })

    it("extends a class instance", function () {
      class X {}
      const c = new X()
      LifeCycle.mixInto(c)
      assert.isFunction(c.subscribe);
      assert.isFunction(c.computed);
      assert.isFunction(c.addEventListener);
      assert.isFunction(c.anchorTo);
      assert.isFunction(c.dispose);
      assert.isFunction(c.addDisposable);
      assert.isNotFunction(c.mixInto);
    })
  })

  describe('dispose', function() {
    it("disposes of subscriptions", function() {
      var Ctr, c, o;
      o = observable();
      Ctr = (function() {
        function Ctr() {
          this.subscribe(o, this.ons);
        }
        return Ctr;
      })();
      LifeCycle.mixInto(Ctr);
      c = new Ctr();
      assert.equal(o.getSubscriptionsCount(), 1);
      c.dispose();
      assert.equal(o.getSubscriptionsCount(), 0);
    })

    it("disposes of computeds", function() {
      var Ctr, c, o;
      o = observable();
      Ctr = (function() {
        function Ctr() {
          this.computed(o, 'comp');
        }
        Ctr.prototype.comp = function() {
          return o();
        };
        return Ctr;
      })();
      LifeCycle.mixInto(Ctr);
      c = new Ctr();
      assert.equal(o.getSubscriptionsCount(), 1);
      c.dispose();
      assert.equal(o.getSubscriptionsCount(), 0);
    })

    it("addEventListener removes the event on dispose", function() {
      var Ctr, c, div, o;
      o = observable(0);
      div = document.createElement('div');
      Ctr = (function() {
        function Ctr() {
          this.addEventListener(div, 'click', function() {
            return o(o() + 1);
          })
        }
        return Ctr;
      })();
      LifeCycle.mixInto(Ctr);
      c = new Ctr();
      div.click();
      assert.equal(o(), 1);
      c.dispose();
      div.click();
      assert.equal(o(), 1);
    })

    it.skip("disposes when anchored nodes are cleaned", function() {
      /**
       * We're only skipping this because it requires a little more
       * setup (i.e. applyBindings + cleanNode), but it's relatively
       * marginal value given the simplicity and how simple the
       * functionality of anchorTo is.
       */
      var Ctr, c, div, o;
      o = observable();
      Ctr = (function() {
        function Ctr() {
          this.computed(o, 'comp');
        }
        Ctr.prototype.comp = function() {
          return o();
        };
        return Ctr;
      })();
      LifeCycle.mixInto(Ctr);
      c = new Ctr();
      div = document.createElement('div');
      c.anchorTo(div);
      assert.equal(o.getSubscriptionsCount(), 1);
      cleanNode(c);
      assert.equal(o.getSubscriptionsCount(), 0);
    })

  })

});