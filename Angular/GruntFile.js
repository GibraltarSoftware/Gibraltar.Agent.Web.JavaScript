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
			build:['dist']
		},
		jshint: {
			all:['src/Loupe.Agent.Angular.js']
		},
		copy: {
			main: {
				files: [
					{ src:  ['src/Loupe.Agent.Angular.js'], dest: 'dist/Loupe.Agent.Angular.js'},
				]
			}
		},			
		uglify: {
			build: {
				files: {
					'dist/Loupe.Agent.Angular.min.js': ['dist/Loupe.Agent.Angular.js']
				}
			}
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
				src: 'src/Loupe.Agent.Angular.js',
				options : {
					host: 'http://127.0.0.1:3377',
					specs : ['spec/*.js','!spec/When_logging_stack_trace.js'],
					helpers: ['spec/helpers/*.js'],
					vendor: ['spec/vendor/angular.js', 
							 'spec/vendor/angular-route.js',
							 'spec/vendor/angular-mocks.js',
							 'spec/vendor/angular-ui-router.js', 
							 'spec/vendor/platform.js']
				}
			},
			build: {
				src: 'dist/Loupe.Agent.Angular.min.js',
				options : {
					host: 'http://127.0.0.1:3377',
					specs : ['spec/*.js','!spec/When_logging_stack_trace.js'],
					helpers: ['spec/helpers/*.js'],
					vendor: ['spec/vendor/angular.js', 
							 'spec/vendor/angular-route.js',
							 'spec/vendor/angular-mocks.js',
							 'spec/vendor/angular-ui-router.js', 
							 'spec/vendor/platform.js'],
			        template : require('grunt-template-jasmine-istanbul'),
			        templateOptions: {
			          coverage: 'reports/coverage.json',
			          report: 'reports/coverage'
			        }								 
				}
			}			
		},
		watch: {
			scripts: {
				files: ['src/Loupe.Agent.Angular.js', 'spec/*.js','spec/helpers/app.js'],
				tasks: 'test'
			}
		}			
	});
	
	grunt.loadNpmTasks('grunt-contrib-clean');
	grunt.loadNpmTasks('grunt-contrib-jshint');
	grunt.loadNpmTasks('grunt-contrib-copy');
	grunt.loadNpmTasks('grunt-contrib-uglify');
	grunt.loadNpmTasks('grunt-contrib-connect');
	grunt.loadNpmTasks('grunt-contrib-jasmine');
	grunt.loadNpmTasks('grunt-contrib-watch');

	grunt.registerTask('test',['connect','jasmine:unit']);
	grunt.registerTask('default',['clean','copy', 'uglify','connect', 'jasmine:build']);
};