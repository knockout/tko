
import {
    applyBindings, contextFor
} from 'tko.bind';

import {
    observable
} from 'tko.observable';

import {
    Provider
} from 'tko.provider';

import {
    options
} from 'tko.utils';

import { bindings as ifBindings, } from '../index.js';
import {bindings as coreBindings} from 'tko.binding.core';

import 'tko.utils/helpers/jasmine-13-helper.js';

describe("else inside an if binding", function () {
  beforeEach(jasmine.prepareTestNode);

  beforeEach(function(){
      var provider = new Provider();
      options.bindingProviderInstance = provider;
      provider.bindingHandlers.set(coreBindings);
      provider.bindingHandlers.set(ifBindings);
  });

  describe("as <!-- else -->", function () {
    it("is ignored when the condition is true", function () {
      testNode.innerHTML = "<i data-bind='if: x'>" +
        "abc <!-- else --> def" +
        "</i>";
      expect(testNode.childNodes[0].childNodes.length).toEqual(3);
      applyBindings({ x: true }, testNode);
      expect(testNode.childNodes[0].childNodes.length).toEqual(1);
      expect(testNode.innerText).toEqual("abc")
    })

    it("shows the else-block when the condition is false", function () {
      testNode.innerHTML = "<i data-bind='if: x'>" +
        "abc <!-- else --> def " +
        "</i>";
      expect(testNode.childNodes[0].childNodes.length).toEqual(3);
      applyBindings({ x: false }, testNode);
      expect(testNode.childNodes[0].childNodes.length).toEqual(1);
      expect(testNode.innerText).toEqual("def")
    })
    
    it("toggles between if/else on condition change", function () {
      testNode.innerHTML = "<i data-bind='if: x'>" +
        "abc <!-- else --> def " +
        "</i>";
      var x = observable(false)
      expect(testNode.childNodes[0].childNodes.length).toEqual(3);
      applyBindings({ x: x }, testNode);
      expect(testNode.childNodes[0].childNodes.length).toEqual(1);
      expect(testNode.innerText).toEqual("def")
      x(true)
      expect(testNode.innerText).toEqual("abc")
    })
  })
})