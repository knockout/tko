
import { ieVersion } from '../ie';
import { safeSetTimeout } from '../error';

import { tagNameLower } from './info';
import * as domData from './data';

const hasDomDataExpandoProperty = Symbol('Knockout selectExtensions hasDomDataProperty');

// Normally, SELECT elements and their OPTIONs can only take value of type 'string' (because the values
// are stored on DOM attributes). ko.selectExtensions provides a way for SELECTs/OPTIONs to have values
// that are arbitrary objects. This is very convenient when implementing things like cascading dropdowns.
//
export const selectExtensions = {
  optionValueDomDataKey: domData.nextKey(),

  readValue(element: HTMLSelectElement|HTMLOptionElement): any {
    switch (tagNameLower(element)) {
      case 'option':
        if ((element as any)[hasDomDataExpandoProperty] === true) { return domData.get(element, selectExtensions.optionValueDomDataKey); }
        return element.value;
      case 'select':
        return (element as HTMLSelectElement).selectedIndex >= 0 ? selectExtensions.readValue((element as HTMLSelectElement).options[(element as HTMLSelectElement).selectedIndex]) : undefined;
      default:
        return element.value;
    }
  },

  writeValue(element: HTMLSelectElement, value: any, allowUnset: boolean) {
    switch (tagNameLower(element)) {
      case 'option':
        if (typeof value === 'string') {
          domData.set(element, selectExtensions.optionValueDomDataKey, undefined);
          if (hasDomDataExpandoProperty in element) { // IE <= 8 throws errors if you delete non-existent properties from a DOM node
            delete (element as any)[hasDomDataExpandoProperty];
          }
          element.value = value;
        } else {
                        // Store arbitrary object using DomData
          domData.set(element, selectExtensions.optionValueDomDataKey, value);
          (element as any)[hasDomDataExpandoProperty as any] = true;
                        // Special treatment of numbers is just for backward compatibility. KO 1.2.1 wrote numerical values to element.value.
          (element as any).value = typeof value === 'number' ? value : '';
        }

        break;
      case 'select':
        if (value === '' || value === null) {
          // A blank string or null value will select the caption
          value = undefined;
        }
        let selection = -1;
        for (let i = 0, n = element.options.length, optionValue; i < n; ++i) {
          optionValue = selectExtensions.readValue(element.options[i]);
          // Include special check to handle selecting a caption with a blank string value
          if (optionValue === value || (optionValue === '' && value === undefined)) {
            selection = i;
            break;
          }
        }
        if (allowUnset || selection >= 0 || (value === undefined && element.size > 1)) {
          element.selectedIndex = selection;
          if (ieVersion === 6) {
            // Workaround for IE6 bug: It won't reliably apply values to SELECT nodes during the same execution thread
            // right after you've changed the set of OPTION nodes on it. So for that node type, we'll schedule a second thread
            // to apply the value as well.
            safeSetTimeout(() => { element.selectedIndex = selection; }, 0);
          }
        }
        break;
      default:
        if ((value === null) || (value === undefined)) { value = ''; }
        element.value = value;
        break;
    }
  }
};
