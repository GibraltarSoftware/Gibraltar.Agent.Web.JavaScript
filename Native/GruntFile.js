module.exports = function(grunt){
	
	grunt.initConfig({
		pkg: grunt.file.readJSON('package.json'),
		meta: {
			banner: '/*! <%= pkg.title || pkg.name %> - v<%= pkg.version %> - ' +
					'<%= grunt.template.today("yyyy-mm-dd") %>\n' +
					'<%= pkg.homepage ? "* " + pkg.homepage + "\n" : "" %>' +
					'* Copyright (c) <%= grunt.template.today("yyyy") %> <%= pkg.author.name %>;' +
					' Licensed <%= _.pluck(pkg.licenses, "type").join(", ") %> */'
		},
		clean: {
			build:['dist'],
			test: ['node_modules/grunt-contrib-jasmine/tasks/jasmine.js']
		},
		jshint: {
			all:['src/Loupe.Agent.Native.js']
		},
		copy: {
			main: {
				files: [
					{ src:  ['src/Loupe.Agent.Native.js'], dest: 'dist/Loupe.Agent.Native.js'},
					{ src: ['custom_jasmine_grunt_task/jasmine.js'], dest:'node_modules/grunt-contrib-jasmine/tasks/jasmine.js'}
				]
			},
			test: {
				files: [{ src: 'custom_jasmine_grunt_task/jasmine.js',dest:'node_modules/grunt-contrib-jasmine/tasks/jasmine.js'}]
			}
		},			
		uglify: {
			build: {
				files: {
					'dist/Loupe.Agent.Native.min.js': ['dist/Loupe.Agent.Native.js']
				}
			},
		},
		connect: {
			server: {
				options: {
					port: 3377
				}
			}
		},
		jasmine : {
			unit: {
				src: 'src/Loupe.Agent.Native.js',
				options : {
					host: 'http://127.0.0.1:3377',
					specs : ['spec/*.js', '!spec/When_propagating_error.js'],
					helpers: ['spec/helpers/*.js'],
					vendor: ['spec/vendor/sinon.js', 'spec/vendor/platform.js'],
					ignoreError: true,
					outputTrace: false
				}
			},
			build: {
				src: 'dist/Loupe.Agent.Native.min.js',
				options : {
					host: 'http://127.0.0.1:3377',
					specs : ['spec/*.js', '!spec/When_propagating_error.js'],
					helpers: ['spec/helpers/*.js'],
					vendor: ['spec/vendor/sinon.js', 'spec/vendor/platform.js'],
					ignoreError: true,
					outputTrace: false
				}
			}			
		}		
	});

	grunt.loadNpmTasks('grunt-contrib-clean');
	grunt.loadNpmTasks('grunt-contrib-jshint');
	grunt.loadNpmTasks('grunt-contrib-copy');
	grunt.loadNpmTasks('grunt-contrib-uglify');
	grunt.loadNpmTasks('grunt-contrib-connect');
	grunt.loadNpmTasks('grunt-contrib-jasmine');

	grunt.registerTask('test',['clean:test','copy:test', 'connect','jasmine:unit']);
	grunt.registerTask('default',['clean:build','copy:main', 'uglify', 'connect', 'jasmine:build']);
};