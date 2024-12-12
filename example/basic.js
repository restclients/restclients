(() => {
  logging.info("script start");
  logging.info("request: %j", request);
  logging.info("file variable hostname: %s", vars.resolveVariables(["hostname"]));
  vars.addEnvironmentVariable("postsPath", "posts");
  vars.addFileVariable("postsId", `${JSON.parse(request.res.body).id + 2}`);
})();
