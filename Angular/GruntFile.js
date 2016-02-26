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
			debug: '_SpecRunner.html'
		},
		jshint: {
            options:{
				reporter: require('jshint-stylish'),
				jshintrc: '.jshintrc'
			},
			target:['src/Loupe.Angular.Agent.js']
		},
		copy: {
			main: {
				files: [
					{ src:  ['src/Loupe.Angular.Agent.js'], dest: 'dist/Loupe.Angular.Agent.js'},
				]
			}
		},			
		uglify: {
			build: {
				files: {
					'dist/Loupe.Angular.Agent.min.js': ['dist/Loupe.Angular.Agent.js']
				}
			}
		},
		connect: {
			server: {
				options: {
					port: 3378
				}
			},
			debug: {
				options: {
					port: 3378,
					keepalive: true,
					open: "http://localhost:3378/_SpecRunner.html"
				}
			}
		},
		jasmine : {
			options: {
					host: 'http://127.0.0.1:3378',
					specs : ['spec/*.js','!spec/When_logging_stack_trace.js'],
					helpers: ['spec/helpers/*.js'],
					vendor: ['spec/vendor/angular.js', 
							 'spec/vendor/angular-route.js',
							 'spec/vendor/angular-mocks.js',
							 'spec/vendor/angular-ui-router.js', 
							 'spec/vendor/platform.js']				
			},
			unit: {
				src: 'src/Loupe.Angular.Agent.js',
			},
			debug: {
				src: 'src/Loupe.Angular.Agent.js',
				options : {
					keepRunner: true
				}
			},			
			build: {
				src: 'dist/Loupe.Angular.Agent.min.js',
				options : {
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
				files: ['src/Loupe.Angular.Agent.js', 'spec/*.js','spec/helpers/app.js'],
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

    grunt.registerTask('analyse', ['jshint']);
	grunt.registerTask('debug',['clean:debug', 'jasmine:debug:build', 'connect:debug']);
	grunt.registerTask('test',['connect:server','jasmine:unit']);
	grunt.registerTask('default',['clean','copy', 'uglify','connect:server', 'jasmine:build']);
};