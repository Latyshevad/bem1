var loadData = function (debug) {
    return function (destination, source) {
        delete require.cache[require.resolve('./source/data/!data.js')];
        var data = require('./source/data/!data.js'),
            dataJsFile = './' + source[0]
                    .replace('pages', 'data')
                    .replace('.pug', '.js');

        try {
            if (require('fs').statSync(dataJsFile)) {
                delete require.cache[require.resolve(dataJsFile)];
                data = require('extend')(
                    data,
                    require(dataJsFile),
                    {}
                );
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
            js: {
                files: {
                    'build/js/common.js': ['source/js/**/*.js']
                }
            },
            css: {
                files: {
                    'source/less/style.less.c': ['source/less/style.less', 'source/less/blocks/*.less']
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
                    'build/css/style.css': 'source/less/style.less.c'
                }
            },
            prod: {
                options: {
                    compress: true
                },
                files: {
                    'build/css/style.min.css': 'source/less/style.less.c'
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

        clean: {
            afterbuild: {
                src: ['source/less/style.less.c']
            }
        },

        watch: {
            options: {
                livereload: false
            },
            scripts: {
                files: ['source/js/**/*.js'],
                tasks: [
                    'concat:js'
                ],
                options: {
                    spawn: false
                }
            },
            css: {
                files: ['source/less/**/*.less'],
                tasks: [
                    'concat:css',
                    'less:default'
                ],
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
    grunt.loadNpmTasks('grunt-contrib-clean');

    // Default task.
    grunt
        .registerTask(
            'default',
            [
                'copy',
                'pug:default',
                'concat:js',
                'concat:css',
                'less:default',
                'clean:afterbuild'
            ]
        );

    // Production task.
    grunt
        .registerTask(
            'prod',
            [
                'copy',
                'pug:prod',
                'concat:js',
                'uglify:prod',
                'concat:css',
                'less:prod',
                'postcss:prod',
                'replace:prod',
                'clean:afterbuild'
            ]
        );
};
