
var ko = {}
import * as utils from 'tko.utils'
import * as observable from 'tko.observable'
import * as extenders from './src/defaultExtenders'

ko.utils = utils
utils.extend(ko, observable)

utils.extend(observable.extenders, extenders)
