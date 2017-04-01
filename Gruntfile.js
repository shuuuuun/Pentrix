module.exports = function(grunt) {
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    release: {
      options: {
        push: false,
        pushTags: false,
        npm: false,
        tagName: 'v<%= version %>',
        commitMessage: 'release v<%= version %>',
      }
    }
  });

  grunt.loadNpmTasks('grunt-release');
  grunt.registerTask('default', ['release:patch']);
};
