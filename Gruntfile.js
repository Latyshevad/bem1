// Config
const SOURCE_PATH = 'source';
const RESOURCES_PATH = 'resources';
const BUILD_PATH = 'build';

var loadData = function (debug) {
    return function (destination, source) {
        delete require.cache[require.resolve('./source/data/!data.js')];

        var data = require('./source/data/!data.js'),
            dataJsFile = './' + source[0]
                    .replace('markup/pages', 'data')
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
                cwd: RESOURCES_PATH + '/',
                src: [
                    '**',
                    '!.gitkeep',
                    '!sprite',
                    '!sprite/**/*'
                ],
                expand: true,
                dest: './' + BUILD_PATH
            }
        },

        pug: {
            default: {
                options: {
                    data: loadData(true),
                    pretty: true
                },
                files: [{
                    cwd: SOURCE_PATH + '/markup/pages',
                    src: [
                        '**/*.pug',
                        '!includes/*',
                        '!layout.pug'
                    ],
                    dest: BUILD_PATH,
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
                    cwd: SOURCE_PATH + '/markup/pages',
                    src: [
                        '**/*.pug',
                        '!includes/*',
                        '!layout.pug'
                    ],
                    dest: BUILD_PATH,
                    expand: true,
                    ext: ".html"
                }]
            }
        },

        concat: {
            options: {},
            js: {
                files: [{
                    dest: BUILD_PATH + '/js/common.js',
                    src: [
                        SOURCE_PATH + '/js/common.js',
                        SOURCE_PATH + '/js/**/*.js'
                    ]
                }]
            },
            css: {
                files: [{
                    dest: SOURCE_PATH + '/less/.style.less.c',
                    src: [
                        SOURCE_PATH + '/less/style.less',
                        SOURCE_PATH + '/less/.sprite.less',
                        SOURCE_PATH + '/less/.sprite@2x.less',
                        SOURCE_PATH + '/less/blocks/*.less'
                    ]
                }]
            }
        },

        uglify: {
            prod: {
                options: {},
                files: [{
                    dest: BUILD_PATH + '/js/common.min.js',
                    src: [
                        BUILD_PATH + '/js/common.js'
                    ]
                }]
            }
        },

        less: {
            default: {
                options: {
                    compress: false
                },
                files: [{
                    dest: BUILD_PATH + '/css/style.css',
                    src: [
                        SOURCE_PATH + '/less/.style.less.c'
                    ]
                }]
            },
            prod: {
                options: {
                    compress: true,
                    sourceMap: false
                },
                files: [{
                    dest: BUILD_PATH + '/css/style.min.css',
                    src: [
                        SOURCE_PATH + '/less/.style.less.c'
                    ]
                }]
            }
        },

        postcss: {
            options: {
                map: false,
                processors: [
                    require('autoprefixer')({
                        browsers: ['last 2 versions']
                    })
                ]
            },
            prod: {
                src: BUILD_PATH + '/css/*.css'
            }
        },

        replace: {
            prod: {
                src: [
                    BUILD_PATH + '/*.html'
                ],
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
                src: [
                    SOURCE_PATH + '/less/.style.less.c',
                    SOURCE_PATH + '/less/.sprite.less',
                    SOURCE_PATH + '/less/.sprite@2x.less'
                ]
            }
        },

        sprite: {
            normal: {
                src: RESOURCES_PATH + '/sprite/@1x/*.png',
                dest: BUILD_PATH + '/images/sprite.png',
                destCss: SOURCE_PATH + '/less/.sprite.less',
                padding: 2,
                cssTemplate: function (params) {
                    var result = '.chunk {display: inline-block; background-image: url(../images/sprite.png); background-repeat: no-repeat;\n\n';
                    for (var i = 0, ii = params.items.length; i < ii; i += 1) {
                        result += '&_' + params.items[i].name + '{' +
                            'background-position: ' + params.items[i].px.offset_x + ' ' + params.items[i].px.offset_y + ';' +
                            'width: ' + params.items[i].px.width + ';' +
                            'height: ' + params.items[i].px.height + ';' +
                            '}\n'
                    }
                    result += '}';

                    if(params.items.length) {
                        return result;
                    }

                    return '';
                }
            },
            large: {
                src: RESOURCES_PATH + '/sprite/@2x/*.png',
                dest: BUILD_PATH + '/images/sprite@2x.png',
                destCss: SOURCE_PATH + '/less/.sprite@2x.less',
                padding: 4,
                cssTemplate: function (params) {
                    var result = '@media only screen and (-webkit-min-device-pixel-ratio: 2), only screen and (-moz-min-device-pixel-ratio: 2), only screen and (-o-min-device-pixel-ratio: 2/1), only screen and (min-device-pixel-ratio: 2), only screen and (min-resolution: 192dpi), only screen and (min-resolution: 2dppx) {\n';
                    result += '.chunk {display: inline-block; background-image: url(../images/sprite@2x.png); background-repeat: no-repeat;\n\n';
                    for (var i = 0, ii = params.items.length; i < ii; i += 1) {
                        result += '&_' + params.items[i].name + '{' +
                            'background-position: ' + params.items[i].offset_x/2 + 'px ' + params.items[i].offset_y/2 + 'px;' +
                            'background-size: ' + params.items[i].total_width/2 + 'px ' + params.items[i].total_height/2 + 'px;' +
                            'width: ' + params.items[i].width/2 + 'px;' +
                            'height: ' + params.items[i].height/2 + 'px;' +
                            '}\n'
                    }
                    result += '}\n}';

                    if(params.items.length) {
                        return result;
                    }

                    return '';
                }
            }
        },

        watch: {
            options: {
                livereload: 35729
            },
            scripts: {
                files: [
                    SOURCE_PATH + '/js/**/*.js'
                ],
                tasks: [
                    'concat:js'
                ],
                options: {
                    spawn: false
                }
            },
            css: {
                files: [
                    SOURCE_PATH + '/less/**/*.less'
                ],
                tasks: [
                    'concat:css',
                    'less:default'
                ],
                options: {
                    spawn: false
                }
            },
            html: {
                files: [
                    SOURCE_PATH + '/markup/**/*.pug'
                ],
                tasks: [
                    'copy',
                    'concat',
                    'pug:default'
                ],
                options: {
                    spawn: false
                }
            },
            data: {
                files: [
                    SOURCE_PATH + '/data/**/*.js'
                ],
                tasks: [
                    'copy',
                    'concat',
                    'pug:default'
                ],
                options: {
                    spawn: false
                }
            },
            sprite: {
                files: [
                    RESOURCES_PATH + '/sprite/**/*.png'
                ],
                tasks: [
                    'sprite',
                    'concat:css',
                    'less:default'
                ],
                options: {
                    spawn: false
                }
            }
        },

        'http-server': {
            default: {
                root: BUILD_PATH + '/',
                port: 8282,
                host: "127.0.0.1",
                cache: false,
                showDir: true,
                autoIndex: true,
                ext: "html",
                runInBackground: true,
                openBrowser: true
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
    grunt.loadNpmTasks('grunt-spritesmith');
    grunt.loadNpmTasks('grunt-http-server');

    // Default task.
    grunt
        .registerTask(
            'default',
            [
                'copy',
                'pug:default',
                'sprite',
                'concat:js',
                'concat:css',
                'less:default',
                'watch'
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
                'sprite',
                'concat:css',
                'less:prod',
                'postcss:prod',
                'replace:prod',
                'clean:afterbuild'
            ]
        );

    // Run local server.
    grunt
        .registerTask(
            'serve',
            [
                'copy',
                'pug:default',
                'sprite',
                'concat:js',
                'concat:css',
                'less:default',
                'http-server',
                'watch'
            ]
        );
};
