'use strict';

import chai from 'chai'
import Promise from 'bluebird';
import chaiAsPromised from 'chai-as-promised'
import sinonChai from 'sinon-chai'

global.should = chai.should();
chai.use(chaiAsPromised);
chai.use(sinonChai);

global.expect = chai.expect;
global.AssertionError = chai.AssertionError;
global.Assertion = chai.Assertion;
global.assert = chai.assert;
