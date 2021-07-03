import tko from "./tko";

console.log("Entry.");

class TheTime extends tko.Component {
  get template() {
    const date = new Date().toISOString();
    return <div>{date}</div>;
  }
}

tko.components.unregister("the-time");
TheTime.register("the-time");

tko.cleanNode(document.body);
tko.applyBindings();
