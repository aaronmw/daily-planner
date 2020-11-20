(window.webpackJsonp = window.webpackJsonp || []).push([
    [0],
    {
        171: function (n, t, e) {
            'use strict';
            e.r(t);
            var a = e(21),
                c = e(2),
                o = e(0),
                r = e.n(o),
                i = e(55),
                s = e.n(i),
                u = e(1),
                l = e(29),
                d = e.n(l),
                p = (e(35), e(3)),
                f = e(5),
                b = function (n) {
                    var t =
                            arguments.length > 1 && void 0 !== arguments[1]
                                ? arguments[1]
                                : function () {},
                        e = Object(o.useState)(!1),
                        a = Object(c.a)(e, 2),
                        r = a[0],
                        i = a[1];
                    return [
                        {
                            isTargetedForDrop: r,
                            droppable: !0,
                            onDragEnter: function (n) {
                                n.preventDefault(), i(!0);
                            },
                            onDragOver: function (n) {
                                n.preventDefault(), i(!0);
                            },
                            onDragLeave: function () {
                                i(!1);
                            },
                            onDrop: function (e) {
                                var a = e.dataTransfer.getData(n);
                                a && t(isNaN(a) ? a : parseFloat(a), e), i(!1);
                            },
                        },
                    ];
                },
                m = e(4),
                g = '\ud83d\udccc',
                h = [15, 30, 45, 60, 90, 120],
                v = [{ id: 1, label: 'Default List' }],
                O = [],
                E = '7:00',
                j = '24:00',
                x = 'transition: all 0.15s ease-in-out',
                D = {
                    motivational_descriptors: [
                        'Adorable',
                        'Adventurous',
                        'Amazing',
                        'Ambitious',
                        'Awesome',
                        'Beautiful',
                        'Bold',
                        'Bright',
                        'Charming',
                        'Clean',
                        'Colourful',
                        'Cute',
                        'Dashing',
                        'Elegant',
                        'Excellent',
                        'Exciting',
                        'Fabulous',
                        'Fantastic',
                        'Fresh',
                        'Gorgeous',
                        'Happy',
                        'Important',
                        'Incredible',
                        'Neat',
                        'Outstanding',
                        'Scrappy',
                        'Sleek',
                        'Special',
                        'Splendid',
                        'Super',
                        'Thoughtful',
                        'Wonderful',
                    ],
                    empty_label: '...label?',
                    empty_notes: '...notes?',
                    new_task_label: 'New Task',
                    new_task_notes: '',
                },
                R = { PRIMARY: '#0094FF', BACKGROUND: '#000209' };
            (R.HIGH_CONTRAST_BACKGROUND = R.PRIMARY),
                (R.HIGH_CONTRAST_TEXT = R.BACKGROUND),
                (R.BORDER_HOVER = Object(m.c)(0.5, '#0094FF')),
                (R.BORDER_IDLE = Object(m.c)(0.3, '#0094FF')),
                (R.SHADED = Object(m.a)(0.1, R.BACKGROUND)),
                (R.TEXT = Object(m.c)(0.85, R.PRIMARY)),
                (R.TEXT_FADED = Object(m.c)(0.4, R.TEXT)),
                (R.BORDER_NEUTRAL = Object(m.c)(0.15, R.TEXT));
            var T = { PRIMARY: '#0094FF', BACKGROUND: 'white' };
            (T.HIGH_CONTRAST_BACKGROUND = T.PRIMARY),
                (T.HIGH_CONTRAST_TEXT = T.BACKGROUND),
                (T.BORDER_HOVER = Object(m.b)('#0094FF', 0.5)),
                (T.BORDER_IDLE = Object(m.b)('#0094FF', 0.3)),
                (T.BORDER_NEUTRAL = Object(m.c)(0.75, T.BACKGROUND)),
                (T.SHADED = Object(m.c)(0.95, T.PRIMARY)),
                (T.TEXT = Object(m.c)(0.15, T.PRIMARY)),
                (T.TEXT_FADED = T.BORDER_NEUTRAL);
            var k = { DARK: R, LIGHT: T },
                w = function (n) {
                    return '\n    max(\n        (100vh - '
                        .concat('30px', ') / (')
                        .concat(8, ' * 60) * ')
                        .concat(n, ',\n        ')
                        .concat('30px', ' * 2 * ')
                        .concat(n, ' / 60\n    )\n');
                },
                A = function (n) {
                    return parseInt(n, 10);
                },
                y = u.d.div(function (n) {
                    var t = n.border,
                        e = void 0 !== t && t,
                        a = n.isFlexible,
                        c = void 0 !== a && a,
                        o = n.margin,
                        r = void 0 === o ? 0 : o,
                        i = n.marginX,
                        s = void 0 === i ? 0 : i,
                        u = n.marginY,
                        l = void 0 === u ? 0 : u,
                        d = n.padding,
                        p = void 0 === d ? 0 : d,
                        f = n.paddingX,
                        b = void 0 === f ? 0 : f,
                        m = n.paddingY,
                        g = void 0 === m ? 0 : m,
                        h = n.theme;
                    return '\n        box-shadow: '
                        .concat(
                            e
                                ? '0 0 0 1px '.concat(k[h.name].BORDER_NEUTRAL)
                                : 'none',
                            ';\n        flex-grow: '
                        )
                        .concat(c ? 1 : 0, ';\n        flex-shrink: ')
                        .concat(c ? 1 : 0, ';\n        ')
                        .concat(
                            s
                                ? '\n                    margin-left: calc('
                                      .concat(s, ' * ')
                                      .concat(
                                          '30px',
                                          ');\n                    margin-right: calc('
                                      )
                                      .concat(s, ' * ')
                                      .concat('30px', ');\n                ')
                                : '',
                            '\n        '
                        )
                        .concat(
                            l
                                ? '\n                    margin-top: calc('
                                      .concat(l, ' * ')
                                      .concat(
                                          '30px',
                                          ');\n                    margin-bottom: calc('
                                      )
                                      .concat(l, ' * ')
                                      .concat('30px', ');\n                ')
                                : '',
                            '\n        '
                        )
                        .concat(
                            r
                                ? '\n                    margin: calc('
                                      .concat(r, ' * ')
                                      .concat('30px', ');\n                ')
                                : '',
                            '\n        '
                        )
                        .concat(
                            b
                                ? '\n                    padding-left: calc('
                                      .concat(b, ' * ')
                                      .concat(
                                          '30px',
                                          ');\n                    padding-right: calc('
                                      )
                                      .concat(b, ' * ')
                                      .concat('30px', ');\n                ')
                                : '',
                            '\n        '
                        )
                        .concat(
                            g
                                ? '\n                    padding-top: calc('
                                      .concat(g, ' * ')
                                      .concat(
                                          '30px',
                                          ');\n                    padding-bottom: calc('
                                      )
                                      .concat(g, ' * ')
                                      .concat('30px', ');\n                ')
                                : '',
                            '\n        '
                        )
                        .concat(
                            p
                                ? '\n                    padding: calc('
                                      .concat(p, ' * ')
                                      .concat('30px', ');\n                ')
                                : '',
                            '\n    '
                        );
                }),
                _ = Object(u.d)(y)(function (n) {
                    var t = n.align,
                        e = void 0 === t ? 'center' : t,
                        a = n.direction,
                        c = void 0 === a ? 'row' : a,
                        o = n.isFlexible,
                        r = void 0 !== o && o,
                        i = n.justify,
                        s = void 0 === i ? 'stretch' : i,
                        u = n.spacing,
                        l = void 0 === u ? 0 : u;
                    return '\n        align-items: '
                        .concat(
                            e,
                            ';\n        display: flex;\n        flex-direction: '
                        )
                        .concat(c, ';\n        flex-grow: ')
                        .concat(r ? 1 : 0, ';\n        flex-shrink: ')
                        .concat(r ? 1 : 0, ';\n        justify-content: ')
                        .concat(
                            s,
                            ';\n        width: 100%;\n        \n        '
                        )
                        .concat(
                            l
                                ? '\n                    & > * + * {\n                        margin-'
                                      .concat(
                                          'row' === c ? 'left' : 'top',
                                          ': calc('
                                      )
                                      .concat(l, ' * ')
                                      .concat(
                                          '30px',
                                          ');\n                    }\n                '
                                      )
                                : '',
                            '\n    '
                        );
                }),
                S = Object(u.d)(_).attrs({
                    direction: 'column',
                    isFlexible: !0,
                })(function (n) {
                    n.theme;
                    return '\n        \n    ';
                }),
                C = Object(u.d)(_).attrs({ direction: 'column' })(function (n) {
                    n.theme;
                    return '\n        height: calc(100vh - '.concat(
                        '30px',
                        ');\n        overflow: auto;\n        position: relative;\n        \n        & > * {\n            align-self: stretch;\n        }\n    '
                    );
                }),
                I = Object(u.d)(_).attrs({ justify: 'center', paddingX: 0.5 })(
                    function (n) {
                        var t = n.theme;
                        return '\n        background: '
                            .concat(k[t.name].BACKGROUND, ';\n        color: ')
                            .concat(
                                k[t.name].TEXT_FADED,
                                ';\n        border-bottom: 2px solid '
                            )
                            .concat(
                                k[t.name].BORDER_NEUTRAL,
                                ';\n        font-size: 0.75rem;\n        height: '
                            )
                            .concat(
                                '30px',
                                ';\n        position: sticky;\n        text-transform: uppercase;\n        top: 0;\n        z-index: 100;\n    '
                            );
                    }
                ),
                F = function (n) {
                    var t = n.children,
                        e = n.label,
                        a = Object(p.a)(n, ['children', 'label']);
                    return r.a.createElement(
                        S,
                        null,
                        r.a.createElement(I, null, e),
                        r.a.createElement(C, a, t)
                    );
                },
                B = Object(u.d)(_).attrs({
                    as: 'button',
                    justify: 'center',
                    paddingX: 0.5,
                    paddingY: 0.25,
                })(function (n) {
                    var t = n.theme;
                    return '\n        background: '
                        .concat(k[t.name].PRIMARY, ';\n        border-radius: ')
                        .concat('3px', ';\n        color: ')
                        .concat(
                            k[t.name].TEXT,
                            ';\n        cursor: pointer;\n        transform: scale(1);\n        '
                        )
                        .concat(
                            x,
                            ';\n        \n        &:focus,\n        &:hover {\n            transform: scale(1.1);\n        }\n        &:active {\n            transform: scale(0.9);\n            filter: hue-rotate(20deg);\n        }\n    '
                        );
                }),
                M = Object(u.d)(B)(function (n) {
                    var t = n.theme;
                    return '\n        background: unset; \n        border-radius: '
                        .concat('3px', ';\n        border: 2px dashed ')
                        .concat(
                            k[t.name].BORDER_IDLE,
                            ';\n        width: 100%;\n        \n        &:focus,\n        &:hover {\n            border-color: '
                        )
                        .concat(k[t.name].BORDER_HOVER, ';\n        }\n    ');
                }),
                N = B,
                L = Object(u.d)(_).attrs({
                    justify: 'space-between',
                    paddingX: 1,
                    paddingY: 0.25,
                    spacing: 0.5,
                })(function (n) {
                    var t = n.theme;
                    return '\n        background-color: '
                        .concat(k[t.name].BACKGROUND, ';\n        color: ')
                        .concat(
                            k[t.name].TEXT_FADED,
                            ';\n        width: 100%;\n        z-index: 10;\n        \n        &:hover {\n            color: '
                        )
                        .concat(k[t.name].TEXT, ';\n        }\n    ');
                }),
                H = Object(u.d)(N)(function (n) {
                    var t = n.isSelected;
                    n.theme;
                    return '\n        background: transparent;\n        color: inherit;\n        font-weight: '
                        .concat(t ? 900 : 100, ';\n        opacity: ')
                        .concat(t ? 1 : 0, ';\n        width: auto;\n        ')
                        .concat(x, ';\n        \n        ')
                        .concat(
                            L,
                            ':hover > & {\n            opacity: 1;\n        }\n    '
                        );
                }),
                X = function (n) {
                    var t = n.options,
                        e = n.renderOption,
                        a =
                            void 0 === e
                                ? function (n) {
                                      return n;
                                  }
                                : e,
                        c = n.renderSelectedOption,
                        o =
                            void 0 === c
                                ? function (n) {
                                      return n;
                                  }
                                : c,
                        i = n.selectedOption,
                        s = n.onChange,
                        u = Object(p.a)(n, [
                            'options',
                            'renderOption',
                            'renderSelectedOption',
                            'selectedOption',
                            'onChange',
                        ]);
                    return r.a.createElement(
                        L,
                        u,
                        t.map(function (n) {
                            var t = n === i;
                            return r.a.createElement(
                                H,
                                {
                                    key: n,
                                    isSelected: t,
                                    onClick: function () {
                                        return s(n);
                                    },
                                },
                                t ? o(a(n)) : a(n)
                            );
                        })
                    );
                },
                U = Object(u.d)(_).attrs({ align: 'flex-start' })(function (n) {
                    var t = n.duration,
                        e = n.isActive,
                        a = n.isDragging,
                        c = n.isDraggingOver,
                        o = n.theme;
                    return '\n        background-color: '
                        .concat(
                            k[o.name].BACKGROUND,
                            ';\n        border-radius: '
                        )
                        .concat(
                            '3px',
                            ';\n        box-shadow: ',
                            '0 0 0 2px '.concat(
                                k[o.name][e ? 'PRIMARY' : 'BORDER_IDLE']
                            ),
                            ';\n        cursor: pointer;\n        height: '
                        )
                        .concat(w(t), ';\n        min-height: ')
                        .concat(w(20), ';\n        opacity: ')
                        .concat(a ? 0.5 : 1, ';\n        padding: 0 calc(')
                        .concat('30px', ' / 2) 0\n            calc(')
                        .concat('30px', ' / 2 + ')
                        .concat('5px', ');\n        pointer-events: ')
                        .concat(
                            c ? 'none' : 'auto',
                            ';\n        position: relative;\n        transition-property: opacity, top;\n        width: 100%;\n        z-index: '
                        )
                        .concat(e ? 10 : 'initial', ';\n        ')
                        .concat(
                            x,
                            ';\n\n        &:before {\n            background-color: '
                        )
                        .concat(
                            k[o.name].PRIMARY,
                            ';\n            border-bottom-left-radius: '
                        )
                        .concat(
                            '3px',
                            ';\n            border-top-left-radius: '
                        )
                        .concat(
                            '3px',
                            ";\n            bottom: 1px;\n            content: '';\n            left: 1px;\n            opacity: "
                        )
                        .concat(
                            e ? 1 : 0.5,
                            ';\n            position: absolute;\n            top: 1px;\n            width: '
                        )
                        .concat('5px', ';\n            ')
                        .concat(
                            x,
                            ';\n        }\n        \n        &:hover {\n            box-shadow: 0 0 0 2px '
                        )
                        .concat(
                            k[o.name].BORDER_HOVER,
                            ';\n        }\n        \n        &:focus {\n            box-shadow: 0 0 0 2px '
                        )
                        .concat(
                            k[o.name].PRIMARY,
                            ';\n        }\n        \n        &:active {\n            box-shadow: 0 0 0 2px '
                        )
                        .concat(k[o.name].PRIMARY, ' inset;\n        }\n    ');
                }),
                Y = Object(u.d)(_).attrs({ spacing: 0.5 })(function (n) {
                    var t = n.isActive,
                        e = n.theme;
                    return '\n        align-items: center;\n        color: '
                        .concat(
                            k[e.name][t ? 'TEXT' : 'TEXT_FADED'],
                            ';\n        display: flex;\n        justify-content: space-between;\n        height: 100%;\n        '
                        )
                        .concat(x, ';\n        \n        ')
                        .concat(U, ':hover > & {\n            color: ')
                        .concat(k[e.name].TEXT, ';\n        }\n    ');
                }),
                G = function (n) {
                    var t = n.appActions,
                        e = (n.appData, n.isActive),
                        a = n.task,
                        i = Object(p.a)(n, [
                            'appActions',
                            'appData',
                            'isActive',
                            'task',
                        ]),
                        s = t.onSelectTask,
                        u = a.icon,
                        l = a.id,
                        d = a.label,
                        f = a.scheduled_minutes,
                        b = (function (n, t) {
                            var e = Object(o.useState)(!1),
                                a = Object(c.a)(e, 2),
                                r = a[0],
                                i = a[1],
                                s = Object(o.useState)(!1),
                                u = Object(c.a)(s, 2),
                                l = u[0],
                                d = u[1];
                            return [
                                {
                                    draggable: !0,
                                    isDragging: r,
                                    isDraggingOver: l,
                                    onDragEnd: function () {
                                        i(!1), d(!1);
                                    },
                                    onDragEnter: function () {
                                        return d(!0);
                                    },
                                    onDragLeave: function () {
                                        return d(!1);
                                    },
                                    onDragStart: function (e) {
                                        e.dataTransfer.setData(n, t), i(!0);
                                    },
                                },
                            ];
                        })('task-id', l),
                        m = Object(c.a)(b, 1)[0];
                    return r.a.createElement(
                        U,
                        Object.assign(
                            {
                                'data-task-id': l,
                                duration: f,
                                isActive: e,
                                tabIndex: 0,
                                onClick: function () {
                                    return s(l);
                                },
                            },
                            m,
                            i
                        ),
                        r.a.createElement(
                            Y,
                            { isActive: e },
                            r.a.createElement(
                                'div',
                                {
                                    style: {
                                        maxHeight: '100%',
                                        overflow: 'auto',
                                    },
                                },
                                d
                            ),
                            r.a.createElement('span', null, u)
                        )
                    );
                };
            function z() {
                var n = Object(f.a)([
                    '\n    position: absolute;\n    left: calc(100% + ',
                    ' * 2);\n    top: 50%;\n    transform: translateY(-50%);\n    white-space: nowrap;\n',
                ]);
                return (
                    (z = function () {
                        return n;
                    }),
                    n
                );
            }
            var K = Object(u.d)(F).attrs({ label: 'Backlog' })(function (n) {
                    var t = n.hasTasks,
                        e = (n.isTargetedForDrop, n.theme);
                    return '\n        background-color: '
                        .concat(
                            k[e.name].SHADED,
                            ';\n        flex-grow: 1;\n        overflow: '
                        )
                        .concat(t ? 'auto' : 'visible', ';\n    ');
                }),
                P = Object(u.d)(y).attrs({ isFlexible: !0 })(function (n) {
                    var t = n.isTargetedForDrop,
                        e = n.theme;
                    return '\n        box-shadow: '.concat(
                        t
                            ? '0 0 0 5px '.concat(
                                  k[e.name].BORDER_HOVER,
                                  ' inset'
                              )
                            : 'initial',
                        ';\n        position: relative;\n    '
                    );
                }),
                V = Object(u.d)(y)(z(), '30px'),
                q = function (n) {
                    var t = n.appActions,
                        e = n.appData,
                        a = n.selectedTaskId,
                        o = n.tasks,
                        i =
                            (n.onClickTask,
                            Object(p.a)(n, [
                                'appActions',
                                'appData',
                                'selectedTaskId',
                                'tasks',
                                'onClickTask',
                            ])),
                        s = t.onChangeTaskPosition,
                        u = t.onChangeTheme,
                        l = t.onCreateTask,
                        d = t.onUpdateTask,
                        f = e.theme,
                        m = b('task-id', function (n) {
                            d(n, { scheduled: !1 }), s(n, 0);
                        }),
                        g = Object(c.a)(m, 1)[0],
                        h = b('task-id', function (n, t) {
                            var a = A(t.currentTarget.dataset.taskId),
                                c = e.tasks.findIndex(function (n) {
                                    return n.id === a;
                                });
                            s(n, c);
                        }),
                        v = Object(c.a)(h, 1)[0],
                        O = o.filter(function (n) {
                            return !n.scheduled;
                        }),
                        E = o.length;
                    return r.a.createElement(
                        K,
                        i,
                        r.a.createElement(X, {
                            options: ['DARK', 'LIGHT'],
                            renderOption: function (n) {
                                return n.toLowerCase();
                            },
                            renderSelectedOption: function (n) {
                                return ''.concat(n, ' mode');
                            },
                            selectedOption: f,
                            onChange: u,
                        }),
                        r.a.createElement(
                            P,
                            g,
                            r.a.createElement(
                                _,
                                {
                                    justify: 'flex-start',
                                    direction: 'column',
                                    spacing: 1,
                                    padding: 1,
                                    style: {
                                        bottom: 0,
                                        left: 0,
                                        overflow: E ? 'auto' : 'visible',
                                        position: 'absolute',
                                        right: 0,
                                        top: 0,
                                    },
                                },
                                r.a.createElement(
                                    'div',
                                    {
                                        style: {
                                            position: 'relative',
                                            width: '100%',
                                        },
                                    },
                                    !E &&
                                        r.a.createElement(
                                            V,
                                            null,
                                            r.a.createElement(
                                                'span',
                                                {
                                                    role: 'img',
                                                    'aria-label':
                                                        'left-pointing hand',
                                                },
                                                '\ud83d\udc48'
                                            ),
                                            ' ',
                                            'Create your first task'
                                        ),
                                    r.a.createElement(
                                        M,
                                        {
                                            style: { height: w(30) },
                                            onClick: function () {
                                                return l();
                                            },
                                        },
                                        'New Task'
                                    )
                                ),
                                O.map(function (n) {
                                    return r.a.createElement(
                                        G,
                                        Object.assign(
                                            {
                                                key: n.id,
                                                appActions: t,
                                                appData: e,
                                                isActive: a === n.id,
                                                task: n,
                                            },
                                            v
                                        )
                                    );
                                })
                            )
                        )
                    );
                };
            function J() {
                var n = Object(f.a)([
                    '\n        animation-direction: alternate;\n        animation-duration: 300ms;\n        animation-iteration-count: infinite;\n        animation-name: ',
                    ';\n        animation-timing-function: ease-in-out;\n        background: ',
                    ';\n        bottom: calc(',
                    ' * -1);\n        border-radius: calc(',
                    ' * 2);\n        height: calc(',
                    ' * 2);\n        pointer-events: ',
                    ';\n        position: fixed;\n        right: calc(',
                    ' * -1);\n        transform: scale(',
                    ');\n        width: calc(',
                    ' * 2);\n        z-index: 100;\n        ',
                    ";\n\n        &:before {\n            align-items: center;\n            content: '",
                    "';\n            display: flex;\n            font-size: 8rem;\n            justify-content: center;\n            height: calc(",
                    ' * 1.25);\n            left: 0;\n            position: absolute;\n            top: 0;\n            width: calc(',
                    ' * 1.25);\n        }\n    ',
                ]);
                return (
                    (J = function () {
                        return n;
                    }),
                    n
                );
            }
            function W() {
                var n = Object(f.a)([
                    '\n    0% {\n        box-shadow: 0 0 0 0 ',
                    ';\n        transform: scale(1);\n    }\n    100% {\n        box-shadow: 0 0 50px 0 ',
                    ';\n        transform: scale(1.2);\n    }\n',
                ]);
                return (
                    (W = function () {
                        return n;
                    }),
                    n
                );
            }
            var Q = function (n) {
                    var t = n.theme;
                    return Object(u.e)(
                        W(),
                        k[t.name].PRIMARY,
                        k[t.name].PRIMARY
                    );
                },
                Z = u.d.div(function (n) {
                    var t = n.isDragging,
                        e = n.isTargetedForDrop,
                        a = n.theme;
                    return Object(u.c)(
                        J(),
                        e ? Q : 'unset',
                        Object(m.d)(e ? 0 : t ? 0.35 : 0.8, k[a.name].PRIMARY),
                        '20vw',
                        '20vw',
                        '20vw',
                        t ? 'all' : 'none',
                        '20vw',
                        t ? 0.5 : 0.25,
                        '20vw',
                        x,
                        '\ud83d\uddd1',
                        '20vw',
                        '20vw'
                    );
                }),
                $ = function (n) {
                    var t = n.appActions,
                        e = n.isDragging,
                        a = Object(p.a)(n, ['appActions', 'isDragging']),
                        o = t.onSelectTask,
                        i = t.onUpdateTask,
                        s = b('task-id', function (n) {
                            i(n, { isComplete: !0 }),
                                o(function (t) {
                                    return t === n ? null : t;
                                });
                        }),
                        u = Object(c.a)(s, 1)[0];
                    return r.a.createElement(
                        Z,
                        Object.assign({ isDragging: e }, u, a)
                    );
                },
                nn = e(58),
                tn = e.n(nn),
                en = e(59),
                an = e.n(en),
                cn = e(60),
                on = e.n(cn),
                rn = function (n) {
                    return [
                        function (t) {
                            var e = [];
                            t.shiftKey && e.push('shift'),
                                t.metaKey && e.push('cmd'),
                                e.push(t.key.toLowerCase());
                            var a = on()(e).sort();
                            an()(n, function (n, e) {
                                var c = e
                                    .split('+')
                                    .map(function (n) {
                                        return n.trim();
                                    })
                                    .sort();
                                a.join('+') === c.join('+') && n(t);
                            });
                        },
                    ];
                },
                sn = Object(u.d)(y).attrs({ isFlexible: !0 })(function (n) {
                    var t = n.isEditing,
                        e = n.isEmpty,
                        a = n.theme;
                    return '\n        cursor: '
                        .concat(
                            t ? 'text' : 'pointer',
                            ';\n        position: relative;\n        opacity: '
                        )
                        .concat(e ? 0.5 : 1, ';\n        user-select: ')
                        .concat(
                            t ? 'text' : 'none',
                            ';\n        width: auto;\n        height: auto;\n    \n        // Tracing element\n        &:before {\n            border: 2px dashed '
                        )
                        .concat(
                            k[a.name].BORDER_HOVER,
                            ';\n            border-radius: '
                        )
                        .concat(
                            '3px',
                            ";\n            content: '';\n            opacity: "
                        )
                        .concat(
                            t ? 1 : 0,
                            ';\n            pointer-events: none;\n            position: absolute;\n            top: calc('
                        )
                        .concat(
                            '30px',
                            ' * 0.5 * -1);\n            right: calc('
                        )
                        .concat(
                            '30px',
                            ' * 0.5 * -1);\n            bottom: calc('
                        )
                        .concat(
                            '30px',
                            ' * 0.5 * -1);\n            left: calc('
                        )
                        .concat('30px', ' * 0.5 * -1);\n            ')
                        .concat(
                            x,
                            ';\n        }\n        \n        &:hover {\n            &:before {\n                opacity: 1;\n            }\n        }\n    '
                        );
                }),
                un = function (n) {
                    var t = n.isMultiLine,
                        e = void 0 !== t && t,
                        a = n.isRemotelyActivated,
                        i = void 0 !== a && a,
                        s = n.placeholder,
                        u = void 0 === s ? 'Empty' : s,
                        l = n.render,
                        d =
                            void 0 === l
                                ? function (n) {
                                      return n;
                                  }
                                : l,
                        f = n.value,
                        b = void 0 === f ? '' : f,
                        m = n.wrapperStyles,
                        g = void 0 === m ? {} : m,
                        h = n.onSave,
                        v = void 0 === h ? function () {} : h,
                        O = Object(p.a)(n, [
                            'isMultiLine',
                            'isRemotelyActivated',
                            'placeholder',
                            'render',
                            'value',
                            'wrapperStyles',
                            'onSave',
                        ]),
                        E = Object(o.useState)(!1),
                        j = Object(c.a)(E, 2),
                        x = j[0],
                        D = j[1],
                        R = Object(o.useState)(b),
                        T = Object(c.a)(R, 2),
                        k = T[0],
                        w = T[1],
                        A = Object(o.useState)(null),
                        _ = Object(c.a)(A, 2),
                        S = _[0],
                        C = _[1],
                        I = Object(o.useRef)(null),
                        F = Object(o.useRef)(null),
                        B = '' === k.trim(),
                        M = !e;
                    Object(o.useEffect)(
                        function () {
                            !0 === i && N();
                        },
                        [i]
                    ),
                        Object(o.useEffect)(
                            function () {
                                w(b);
                            },
                            [b]
                        ),
                        Object(o.useEffect)(
                            function () {
                                x &&
                                    I.current &&
                                    (I.current.select(), I.current.focus());
                            },
                            [I, x]
                        ),
                        Object(o.useEffect)(
                            function () {
                                var n = F.current;
                                n && C(n.offsetHeight);
                            },
                            [k, x, F]
                        );
                    var N = function () {
                            x || (w(b), D(!0));
                        },
                        L = function () {
                            v(k), D(!1);
                        },
                        H = function () {
                            w(b), D(!1);
                        },
                        X = rn({
                            'cmd+escape': H,
                            'shift+escape': H,
                            'cmd+enter': L,
                            'shift+enter': L,
                            escape: L,
                            enter: function (n) {
                                M &&
                                    (L(),
                                    (function (n) {
                                        n.preventDefault();
                                    })(n));
                            },
                        }),
                        U = Object(c.a)(X, 1)[0];
                    return r.a.createElement(
                        sn,
                        Object.assign(
                            {
                                isEditing: x,
                                isEmpty: B,
                                tabIndex: 0,
                                onClick: N,
                            },
                            O
                        ),
                        r.a.createElement(
                            y,
                            { style: g },
                            x
                                ? r.a.createElement(
                                      r.a.Fragment,
                                      null,
                                      r.a.createElement(
                                          'div',
                                          {
                                              ref: F,
                                              style: {
                                                  position: 'absolute',
                                                  pointerEvents: 'none',
                                                  opacity: 0,
                                                  outline: '2px dotted red',
                                                  whiteSpace: 'pre-wrap',
                                                  width: '100%',
                                              },
                                          },
                                          k,
                                          '.'
                                      ),
                                      r.a.createElement('textarea', {
                                          disabled: !x,
                                          ref: I,
                                          rows: 1,
                                          style: {
                                              display: 'block',
                                              height: ''.concat(S, 'px'),
                                              width: '100%',
                                          },
                                          value: k,
                                          onBlur: function () {
                                              v(k), D(!1);
                                          },
                                          onChange: function (n) {
                                              w(n.target.value);
                                          },
                                          onKeyDown: U,
                                      })
                                  )
                                : d(B ? u : b)
                        )
                    );
                };
            function ln() {
                var n = Object(f.a)([
                    '\n    flex-grow: 0;\n    flex-shrink: 0;\n    font-size: 3rem;\n    line-height: 1.4rem;\n    width: 3rem;\n',
                ]);
                return (
                    (ln = function () {
                        return n;
                    }),
                    n
                );
            }
            function dn() {
                var n = Object(f.a)([
                    '\n    flex-grow: 1;\n    flex-shrink: 1;\n    justify-self: stretch;\n',
                ]);
                return (
                    (dn = function () {
                        return n;
                    }),
                    n
                );
            }
            var pn = Object(u.d)(F)(function (n) {
                    var t = n.isLoading,
                        e = n.theme;
                    return '\n        box-shadow: 0 0 0 10px rgba(0, 0, 0, 0.1);\n        border-left: 2px solid '
                        .concat(
                            k[e.name].BORDER_NEUTRAL,
                            ';\n        border-right: 2px solid '
                        )
                        .concat(
                            k[e.name].BORDER_NEUTRAL,
                            ';\n        overflow: unset;\n        z-index: 11;\n        \n        // Blackout curtain\n        &:before {\n            background-color: '
                        )
                        .concat(
                            k[e.name].BACKGROUND,
                            ";\n            bottom: 0;\n            content: '';\n            left: 0;\n            opacity: "
                        )
                        .concat(
                            t ? 1 : 0,
                            ';\n            pointer-events: none;\n            position: absolute;\n            right: 0;\n            top: 0;\n            transition: opacity '
                        )
                        .concat(
                            0.1,
                            's ease-in-out;\n            z-index: 10;\n        }\n    '
                        );
                }),
                fn = Object(u.d)(_).attrs({
                    as: 'h1',
                    align: 'flex-start',
                    spacing: 1.5,
                    paddingX: 1,
                    paddingY: 0.75,
                })(function (n) {
                    var t = n.theme;
                    return '\n        background-color: '.concat(
                        k[t.name].SHADED,
                        ';\n        font-size: 1.4rem;\n        font-weight: 900;\n        position: relative;\n    '
                    );
                }),
                bn = Object(u.d)(y)(dn()),
                mn = Object(u.d)(y).attrs({ role: 'img' })(ln()),
                gn = function (n) {
                    var t = n.appActions,
                        e = void 0 === t ? {} : t,
                        a = (n.appData, n.isCreatingTask),
                        i = void 0 !== a && a,
                        s = n.task,
                        u = void 0 === s ? {} : s,
                        l = Object(p.a)(n, [
                            'appActions',
                            'appData',
                            'isCreatingTask',
                            'task',
                        ]),
                        d = Object(o.useState)(!1),
                        f = Object(c.a)(d, 2),
                        b = f[0],
                        m = f[1],
                        v = e.onUpdateTask,
                        O = u.icon,
                        E = u.id,
                        j = u.label,
                        x = u.notes,
                        R = u.scheduled_minutes,
                        T = !u.id,
                        k = function (n, t) {
                            return v(E, { [n]: t });
                        };
                    return (
                        Object(o.useLayoutEffect)(
                            function () {
                                m(!0);
                                var n = setTimeout(function () {
                                    return m(!1);
                                }, 100);
                                return function () {
                                    return clearTimeout(n);
                                };
                            },
                            [u.id]
                        ),
                        r.a.createElement(
                            pn,
                            Object.assign(
                                {
                                    isLoading: b,
                                    label: 'Selected Task Details',
                                },
                                l
                            ),
                            !T &&
                                !b &&
                                r.a.createElement(
                                    r.a.Fragment,
                                    null,
                                    r.a.createElement(X, {
                                        renderSelectedOption: function (n) {
                                            return ''.concat(n, ' mins');
                                        },
                                        selectedOption: R,
                                        options: h,
                                        onChange: function (n) {
                                            return k('scheduled_minutes', n);
                                        },
                                    }),
                                    r.a.createElement(
                                        fn,
                                        null,
                                        r.a.createElement(
                                            bn,
                                            null,
                                            r.a.createElement(un, {
                                                isRemotelyActivated: i,
                                                placeholder: D.empty_label,
                                                value: j,
                                                onSave: function (n) {
                                                    return k('label', n);
                                                },
                                            })
                                        ),
                                        r.a.createElement(
                                            mn,
                                            null,
                                            r.a.createElement(un, {
                                                placeholder: g,
                                                value: O,
                                                onSave: function (n) {
                                                    return k('icon', n);
                                                },
                                            })
                                        )
                                    ),
                                    r.a.createElement(un, {
                                        isFlexible: !0,
                                        isMultiLine: !0,
                                        margin: 1,
                                        placeholder: D.empty_notes,
                                        render: function (n) {
                                            return r.a.createElement('div', {
                                                className: 'markdown',
                                                dangerouslySetInnerHTML: {
                                                    __html: tn()(n),
                                                },
                                            });
                                        },
                                        wrapperStyles: {
                                            bottom: 0,
                                            left: 0,
                                            overflow: 'auto',
                                            position: 'absolute',
                                            right: 0,
                                            top: 0,
                                        },
                                        value: x,
                                        onSave: function (n) {
                                            return k('notes', n);
                                        },
                                    })
                                )
                        )
                    );
                },
                hn = e(20),
                vn = e.n(hn),
                On = function (n) {
                    return n
                        ? n.split(':').map(function (n) {
                              return A(n);
                          })
                        : [0, 0];
                };
            function En() {
                var n = Object(f.a)([
                    '\n    bottom: 0;\n    height: 100%;\n    left: 0;\n    position: absolute;\n    right: 0;\n    top: 0;\n    width: 100%;\n',
                ]);
                return (
                    (En = function () {
                        return n;
                    }),
                    n
                );
            }
            var jn = u.d.div(En()),
                xn = u.d.div(function (n) {
                    var t = n.isTargetedForDrop,
                        e = n.theme;
                    return '\n        position: relative;\n        width: 100%;\n        height: '
                        .concat(
                            w(15),
                            ';\n        z-index: 1;\n        border-top: '
                        )
                        .concat(
                            t ? '4px dotted '.concat(k[e.name].PRIMARY) : '',
                            ';\n    '
                        );
                }),
                Dn = function (n) {
                    var t,
                        e = n.appActions,
                        a = n.quarterInMinutes,
                        o = Object(p.a)(n, ['appActions', 'quarterInMinutes']),
                        i = e.onUpdateTask,
                        s = On(E),
                        u = Object(c.a)(s, 2),
                        l = u[0],
                        d = u[1],
                        f =
                            ((t = 60 * l + d + 15 * a),
                            ''.concat(Math.floor(t / 60), ':').concat(t % 60)),
                        m = b('task-id', function (n) {
                            return i(n, { scheduled: !0, scheduled_time: f });
                        }),
                        g = Object(c.a)(m, 1)[0];
                    return r.a.createElement(xn, Object.assign({}, g, o));
                },
                Rn = function (n) {
                    var t = n.appActions,
                        e = n.totalMinutes,
                        a = Object(p.a)(n, ['appActions', 'totalMinutes']);
                    return r.a.createElement(
                        jn,
                        a,
                        vn()(e / 15).map(function (n) {
                            return r.a.createElement(Dn, {
                                key: n,
                                appActions: t,
                                quarterInMinutes: n,
                            });
                        })
                    );
                };
            function Tn() {
                var n = Object(f.a)([
                    '\n    position: relative;\n    height: ',
                    ';\n',
                ]);
                return (
                    (Tn = function () {
                        return n;
                    }),
                    n
                );
            }
            function kn() {
                var n = Object(f.a)(['']);
                return (
                    (kn = function () {
                        return n;
                    }),
                    n
                );
            }
            var wn = Object(u.d)(F).attrs({ label: "Today's Plan" })(kn()),
                An = u.d.div(function (n) {
                    var t = n.isTargetedForDrop,
                        e = n.theme;
                    return '\n        bottom: 0;\n        box-shadow: '.concat(
                        t
                            ? '0 0 0 5px '.concat(
                                  k[e.name].BORDER_HOVER,
                                  ' inset'
                              )
                            : 'initial',
                        ';\n        left: 0;\n        overflow: auto;\n        position: absolute;\n        right: 0;\n        top: 0;\n        user-select: none;\n    '
                    );
                }),
                yn = u.d.div(Tn(), w(30)),
                _n = u.d.div(function (n) {
                    var t = n.hideLabel,
                        e = n.isFaded,
                        a = n.theme;
                    return '\n        color: '
                        .concat(
                            t
                                ? 'transparent'
                                : Object(m.d)(e ? 1 : 0, k[a.name].TEXT_FADED),
                            ';\n        padding-right: calc(100% - '
                        )
                        .concat('80px', ' + (')
                        .concat(
                            '30px',
                            ' * 0.5));\n        position: absolute;\n        text-align: right;\n        top: 0;\n        transform: translateY(-50%);\n        width: 100%;\n\n        &:before {\n            background-color: '
                        )
                        .concat(
                            Object(m.d)(
                                e ? 0.8 : 0.5,
                                k[a.name].BORDER_NEUTRAL
                            ),
                            ";\n            content: '';\n            height: 1px;\n            left: "
                        )
                        .concat(
                            '80px',
                            ';\n            position: absolute;\n            right: 0;\n            top: 50%;\n        }\n    '
                        );
                }),
                Sn = Object(u.d)(G)(function (n) {
                    var t = n.offsetMinutes;
                    return '\n        position: absolute;\n        left: calc('
                        .concat('30px', ' * 3);\n        right: ')
                        .concat('30px', ';\n        top: ')
                        .concat(
                            w(t),
                            ';\n        width: auto;\n        z-index: 2;\n    '
                        );
                }),
                Cn = u.d.div(function (n) {
                    var t = n.offsetMinutes;
                    return '\n        background-color: red;\n        height: 1px;\n        left: 0;\n        pointer-events: none;\n        position: absolute;\n        right: 0;\n        top: '.concat(
                        w(t),
                        ';\n        z-index: 10;\n    '
                    );
                }),
                In = function (n) {
                    var t = n.appActions,
                        e = n.selectedTaskId,
                        a = n.from,
                        i = n.tasks,
                        s = n.to,
                        u =
                            (n.onClickTask,
                            Object(p.a)(n, [
                                'appActions',
                                'selectedTaskId',
                                'from',
                                'tasks',
                                'to',
                                'onClickTask',
                            ])),
                        l = Object(o.useState)(null),
                        d = Object(c.a)(l, 2),
                        f = d[0],
                        b = d[1],
                        m = On(f),
                        g = Object(c.a)(m, 2),
                        h = g[0],
                        v = g[1],
                        O = On(a),
                        E = Object(c.a)(O, 2),
                        j = E[0],
                        x = E[1],
                        D = Object(o.useState)(!1),
                        R = Object(c.a)(D, 2),
                        T = R[0],
                        k = R[1],
                        w = i.filter(function (n) {
                            return n.scheduled;
                        }),
                        A = On(s),
                        y = Object(c.a)(A, 2),
                        _ = y[0],
                        S = y[1],
                        C = _ - j,
                        I = 60 * _ + S - (60 * j + x),
                        F = Object(o.useRef)(null),
                        B = Object(o.useRef)(null);
                    Object(o.useEffect)(function () {
                        var n = function () {
                            var n = new Date();
                            b(
                                ''
                                    .concat(n.getHours(), ':')
                                    .concat(n.getMinutes())
                            ),
                                k(!0);
                        };
                        n();
                        var t = setInterval(n, 500);
                        return function () {
                            return clearInterval(t);
                        };
                    }, []),
                        Object(o.useEffect)(
                            function () {
                                T &&
                                    F.current &&
                                    B.current &&
                                    B.current.scrollTo(
                                        0,
                                        F.current.offsetTop - 150
                                    );
                            },
                            [T, F, B]
                        );
                    var M = Object(o.useState)(!1),
                        N = Object(c.a)(M, 2),
                        L = N[0],
                        H = N[1];
                    return r.a.createElement(
                        wn,
                        u,
                        r.a.createElement(
                            An,
                            {
                                ref: B,
                                isTargetedForDrop: L,
                                onDragOver: function () {
                                    return H(!0);
                                },
                                onDragLeave: function () {
                                    return H(!1);
                                },
                                onDragEnd: function () {
                                    return H(!1);
                                },
                            },
                            w.map(function (n) {
                                var a = On(n.scheduled_time),
                                    o = Object(c.a)(a, 2),
                                    i = 60 * o[0] + o[1] - (60 * j + x);
                                return r.a.createElement(Sn, {
                                    key: n.id,
                                    appActions: t,
                                    isActive: e === n.id,
                                    offsetMinutes: i,
                                    task: n,
                                });
                            }),
                            r.a.createElement(Cn, {
                                ref: F,
                                offsetMinutes: 60 * h + v - (60 * j + x),
                            }),
                            r.a.createElement(Rn, {
                                appActions: t,
                                totalMinutes: I,
                            }),
                            vn()(C).map(function (n) {
                                return r.a.createElement(
                                    o.Fragment,
                                    { key: n },
                                    r.a.createElement(
                                        yn,
                                        null,
                                        r.a.createElement(
                                            _n,
                                            { hideLabel: 0 === n },
                                            (j + n) % 12 || 12,
                                            ':00'
                                        )
                                    ),
                                    r.a.createElement(
                                        yn,
                                        null,
                                        r.a.createElement(
                                            _n,
                                            { isFaded: !0 },
                                            (j + n) % 12 || 12,
                                            ':30'
                                        )
                                    )
                                );
                            })
                        )
                    );
                },
                Fn = Object(u.b)(function (n) {
                    var t = n.theme;
                    return '\n        * {\n            background: unset;\n            border: unset;\n            box-sizing: border-box;\n            color: unset;\n            font: unset;\n            font-size: inherit;\n            line-height: 1.4em;\n            list-style-type: none;\n            margin: 0;\n            outline: unset;\n            padding: 0;\n        }\n        :root {\n            background: '
                        .concat(k[t.name].BACKGROUND, ';\n            color: ')
                        .concat(
                            k[t.name].TEXT,
                            ";\n            font-family: 'Operator Mono', monospace;\n            font-size: 15px;\n            font-weight: 300;\n            height: 100%;\n            overflow: hidden;\n        }\n        strong {\n            font-weight: 900;\n        }\n        em {\n            font-style: italic;\n        }\n        \n        .markdown {\n            * + * {\n                margin-top: calc("
                        )
                        .concat(
                            '30px',
                            ' * 0.5);\n            }\n            \n            h1 {\n                color: '
                        )
                        .concat(
                            k[t.name].TEXT_FADED,
                            ';\n                font-size: 1.4rem;\n                font-weight: 500;\n                border-bottom: 2px dotted '
                        )
                        .concat(
                            k[t.name].TEXT_FADED,
                            ';\n                padding-bottom: calc('
                        )
                        .concat(
                            '30px',
                            ' * 0.25);\n                \n                & + * {\n                    margin-top: '
                        )
                        .concat(
                            '30px',
                            ';\n                } \n            }\n        \n            blockquote {\n                border-left: 2px dotted '
                        )
                        .concat(
                            k[t.name].TEXT_FADED,
                            ';\n                font-style: italic;\n                padding: calc('
                        )
                        .concat('30px', ' * 0.5) ')
                        .concat(
                            '30px',
                            ';\n            }\n        \n            li {\n                padding-left: '
                        )
                        .concat(
                            '30px',
                            ";\n                position: relative;\n        \n                &:before {\n                    content: '';\n                    box-sizing: border-box;\n                    position: absolute;\n                    top: 5px;\n                    left: 0;\n                    border: 2px dotted "
                        )
                        .concat(
                            k[t.name].TEXT_FADED,
                            ';\n                    border-radius: 100px;\n                    width: '
                        )
                        .concat('10px', ';\n                    height: ')
                        .concat(
                            '10px',
                            ';\n                }\n            }\n        }\n    '
                        );
                }),
                Bn = function (n, t) {
                    var e = Object(o.useState)(!1),
                        a = Object(c.a)(e, 2),
                        r = a[0],
                        i = a[1],
                        s = Object(o.useState)(t),
                        u = Object(c.a)(s, 2),
                        l = u[0],
                        d = u[1];
                    return (
                        Object(o.useEffect)(
                            function () {
                                if (!r) {
                                    var e = window.localStorage.getItem(n);
                                    d(JSON.parse(e) || t), i(!0);
                                }
                            },
                            [n, t, r]
                        ),
                        Object(o.useEffect)(
                            function () {
                                r &&
                                    window.localStorage.setItem(
                                        n,
                                        JSON.stringify(l)
                                    );
                            },
                            [r, n, l]
                        ),
                        [l, d]
                    );
                };
            function Mn() {
                var n = Bn('lists', v),
                    t = Object(c.a)(n, 2),
                    e = t[0],
                    i = (t[1], Bn('tasks', O)),
                    s = Object(c.a)(i, 2),
                    l = s[0],
                    p = s[1],
                    f = Bn('theme-name', 'DARK'),
                    b = Object(c.a)(f, 2),
                    m = b[0],
                    h = b[1],
                    x = Bn('selected-list-id', 1),
                    R = Object(c.a)(x, 2),
                    T = R[0],
                    k = (R[1], Bn('selected-task-id', null)),
                    w = Object(c.a)(k, 2),
                    A = w[0],
                    y = w[1],
                    S = Object(o.useState)(!1),
                    C = Object(c.a)(S, 2),
                    I = C[0],
                    F = C[1],
                    B = Object(o.useState)(!1),
                    M = Object(c.a)(B, 2),
                    N = M[0],
                    L = M[1],
                    H =
                        (e.find(function (n) {
                            return n.id === T;
                        }),
                        l.find(function (n) {
                            return n.id === A;
                        })),
                    X = l.filter(function (n) {
                        return !n.isComplete;
                    }),
                    U = X.length,
                    Y = function () {
                        return L(!1);
                    };
                Object(o.useEffect)(
                    function () {
                        Y();
                    },
                    [l]
                );
                var G = {
                        onChangeTaskPosition: function (n, t) {
                            p(function (e) {
                                var a = e.filter(function (t) {
                                        return t.id !== n;
                                    }),
                                    c = e.find(function (t) {
                                        return t.id === n;
                                    });
                                return [].concat(
                                    a.slice(0, t),
                                    [c],
                                    a.slice(t)
                                );
                            });
                        },
                        onChangeTheme: h,
                        onCreateTask: function () {
                            var n =
                                    arguments.length > 0 &&
                                    void 0 !== arguments[0]
                                        ? arguments[0]
                                        : {},
                                t = Date.now(),
                                e = new Date(),
                                c = e.getHours(),
                                o = e.getMinutes();
                            p(function (e) {
                                return e.concat([
                                    Object(a.a)(
                                        {
                                            icon: g,
                                            id: t,
                                            list_id: T,
                                            isComplete: !1,
                                            label: ''
                                                .concat(
                                                    d()(
                                                        D.motivational_descriptors
                                                    ),
                                                    ' '
                                                )
                                                .concat(D.new_task_label),
                                            notes: D.new_task_notes,
                                            scheduled: !1,
                                            scheduled_minutes: 30,
                                            scheduled_time: ''
                                                .concat(c, ':')
                                                .concat(o),
                                        },
                                        n
                                    ),
                                ]);
                            }),
                                y(t),
                                F(!0),
                                setTimeout(function () {
                                    return F(!1);
                                }, 1e3);
                        },
                        onSelectTask: y,
                        onUpdateTask: function (n, t) {
                            p(function (e) {
                                return e.map(function (e) {
                                    return e.id === n
                                        ? Object(a.a)(Object(a.a)({}, e), t)
                                        : e;
                                });
                            });
                        },
                    },
                    z = { selectedTaskId: A, tasks: l, theme: m };
                return r.a.createElement(
                    u.a,
                    { theme: { name: m } },
                    r.a.createElement(Fn, null),
                    r.a.createElement($, { appActions: G, isDragging: N }),
                    r.a.createElement(
                        _,
                        {
                            align: 'stretch',
                            direction: 'row-reverse',
                            onDragOver: function () {
                                return L(!0);
                            },
                            onDragEnd: Y,
                        },
                        r.a.createElement(In, {
                            appActions: G,
                            selectedTaskId: A,
                            from: E,
                            style: {
                                opacity: U ? 1 : 0.25,
                                width: '30vw',
                                pointerEvents: U ? 'all' : 'none',
                            },
                            tasks: X,
                            to: j,
                        }),
                        r.a.createElement(gn, {
                            appActions: G,
                            appData: z,
                            task: H,
                            isCreatingTask: I,
                            style: { width: '40vw', opacity: U ? 1 : 0.25 },
                        }),
                        r.a.createElement(q, {
                            appActions: G,
                            appData: z,
                            selectedTaskId: A,
                            style: { width: '30vw' },
                            tasks: X,
                        })
                    )
                );
            }
            var Nn = document.getElementById('root');
            s.a.render(r.a.createElement(Mn, null), Nn);
        },
        63: function (n, t, e) {
            n.exports = e(171);
        },
    },
    [[63, 1, 2]],
]);
//# sourceMappingURL=main.1b638519.chunk.js.map
