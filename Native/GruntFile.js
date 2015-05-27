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
			build: 'dist',
			debug: '_SpecRunner.html',
			test: 'node_modules/grunt-contrib-jasmine/tasks/jasmine.js'
		},
		jshint: {
			all:['src/Loupe.JavaScript.Agent.js']
		},
		copy: {
			main: {
				files: [
					{ src:  ['src/Loupe.JavaScript.Agent.js'], dest: 'dist/Loupe.JavaScript.Agent.js'},
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
					'dist/Loupe.JavaScript.Agent.min.js': ['dist/Loupe.JavaScript.Agent.js']
				}
			},
		},
		connect: {
			server: {
				options: {
					port: 3377
				}
			},
			debug:{
				options: {
					port: 3378,
					keepalive: true,
					open: "http://localhost:3378/_SpecRunner.html"
				}				
			}
		},
		jasmine : {
			options: {
					host: 'http://127.0.0.1:3377',
					specs : ['spec/*.js'],
					helpers: ['spec/helpers/*.js'],
					vendor: ['spec/vendor/sinon.js', 'spec/vendor/platform.js'],
					ignoreError: true,
					outputTrace: false,					
			},
			unit: {
				src: 'src/Loupe.JavaScript.Agent.js'
			},
			debug: {
				src: 'src/Loupe.JavaScript.Agent.js',
				options: {
					keepRunner: true
				}
			},
			build: {
				src: 'dist/Loupe.JavaScript.Agent.min.js',
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
				files: ['src/Loupe.JavaScript.Agent.js', 'spec/*.js'],
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

	grunt.registerTask('debug',['clean:debug', 'jasmine:debug:build', 'connect:debug']);
	grunt.registerTask('test',['clean:test','copy:test', 'connect:server','jasmine:unit']);
	grunt.registerTask('default',['clean:build','copy:main', 'uglify', 'connect:server', 'jasmine:build']);
};