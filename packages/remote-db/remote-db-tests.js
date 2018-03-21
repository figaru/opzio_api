// Import Tinytest from the tinytest Meteor package.
import { Tinytest } from "meteor/tinytest";

// Import and rename a variable exported by remote-db.js.
import { name as packageName } from "meteor/mstrlaw:remote-db";

// Write your tests here!
// Here is an example.
Tinytest.add('remote-db - example', function (test) {
  test.equal(packageName, "remote-db");
});
