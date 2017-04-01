module.exports = function(grunt) {
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    release: {
      options: {
        push: false,
        pushTags: false,
        npm: false,
      }
    }
  });

  grunt.loadNpmTasks('grunt-release');
  grunt.registerTask('default', ['release:patch']);
};
