var loadData = function (debug) {
    return function (destination, source) {
        var data = {},
            dataJsFile = './' + source[0]
                .replace('pages', 'data')
                .replace('.pug', '.js');

        console.log(dataJsFile);

        try {
            if (require('fs').statSync(dataJsFile)) {
                data = require(dataJsFile);
            }
        } catch (e) {}

        data.debug = debug;

        return data;
    }
};

module.exports = function(grunt) {
    grunt.initConfig({
        copy: {
            options: {},
            default: {
                cwd: 'resources/',
                src: ['**', '!.gitkeep'],
                expand: true,
                dest: './build'
            }
        },

        pug: {
            default: {
                options: {
                    data: loadData(true),
                    pretty: true
                },
                files: [{
                    cwd: "source/pages",
                    src: ['**/*.pug', '!includes/*', '!layout.pug'],
                    dest: "build",
                    expand: true,
                    ext: ".html"
                }]
            },
            prod: {
                options: {
                    data: loadData(false),
                    pretty: false
                },
                files: [{
                    cwd: "source/pages",
                    src: ['**/*.pug', '!includes/*', '!layout.pug'],
                    dest: "build",
                    expand: true,
                    ext: ".html"
                }]
            }
        },

        concat: {
            options: {},
            default: {
                files: {
                    'build/js/common.js': ['source/js/**/*.js']
                }
            }
        },

        uglify: {
            prod: {
                options: {},
                files: {
                    'build/js/common.min.js': ['build/js/common.js']
                }
            }
        },

        less: {
            default: {
                options: {
                    compress: false
                },
                files: {
                    'build/css/style.css': 'source/less/style.less'
                }
            },
            prod: {
                options: {
                    compress: true
                },
                files: {
                    'build/css/style.min.css': 'source/less/style.less'
                }
            }
        },

        postcss: {
            options: {
                map: true,
                processors: [
                    require('autoprefixer')({
                        browsers: ['last 2 versions']
                    })
                ]
            },
            prod: {
                src: 'build/css/*.css'
            }
        },

        replace: {
            prod: {
                src: ['build/*.html'],
                overwrite: true,
                replacements: [
                    {
                        from: /css\/style\.css/g,
                        to: "css/style.min.css"
                    },
                    {
                        from: /js\/common\.js/g,
                        to: "js/common.min.js"
                    }
                ]
            }
        },

        watch: {
            options: {
                livereload: false
            },
            scripts: {
                files: ['source/js/**/*.js'],
                tasks: [
                    'concat'
                ],
                options: {
                    spawn: false
                }
            },
            css: {
                files: ['source/less/**/*.less'],
                tasks: ['less:default'],
                options: {
                    spawn: false
                }
            },
            html: {
                files: ['source/**/*.pug'],
                tasks: [
                    'copy',
                    'concat',
                    'pug:default'
                ],
                options: {
                    spawn: false
                }
            }
        }
    });

    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-contrib-pug');
    grunt.loadNpmTasks('grunt-contrib-copy');
    grunt.loadNpmTasks('grunt-contrib-concat');
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-less');
    grunt.loadNpmTasks('grunt-postcss');
    grunt.loadNpmTasks('grunt-text-replace');

    // Default task.
    grunt
        .registerTask(
            'default',
            [
                'copy',
                'pug:default',
                'concat',
                'less:default'
            ]
        );

    // Production task.
    grunt
        .registerTask(
            'prod',
            [
                'copy',
                'pug:prod',
                'concat',
                'uglify:prod',
                'less:prod',
                'postcss:prod',
                'replace:prod'
            ]
        );
};
