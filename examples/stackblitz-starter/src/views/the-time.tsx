import tko from '../tko';

console.log(`TKO-the-time`);

class TheTime extends tko.Component {
  get template() {
    return <em>{new Date().toISOString()}</em>;
  }
}

TheTime.register();
