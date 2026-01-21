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

const applyBindings = async () => {
  // We usually don't need to cleanNode before
  // applying bindings, but it's needed for
  // codesandbox.io
  await tko.cleanNode(document.body);
  tko.applyBindings();
}

applyBindings()
