(window.webpackJsonp = window.webpackJsonp || []).push([
    [0],
    {
        32: function (n, t, e) {
            n.exports = e(72);
        },
        72: function (n, t, e) {
            'use strict';
            e.r(t);
            var a = e(6),
                c = e(2),
                o = e(0),
                r = e.n(o),
                i = e(26),
                s = e.n(i),
                l = e(1),
                u = e(11),
                d = e.n(u),
                p = e(12),
                f = e.n(p),
                b = e(3),
                m = e(5),
                g = function (n) {
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
                                a && t(isNaN(a) ? a : parseFloat(a)), i(!1);
                            },
                        },
                    ];
                },
                v = e(4),
                h = '\ud83d\udccc',
                O = [15, 30, 45, 60, 90, 120],
                E = {},
                j = '7:00',
                x = '24:00',
                R = 'transition: all 0.15s ease-in-out',
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
                T = { PRIMARY: '#0094FF', BACKGROUND: '#000209' };
            (T.HIGH_CONTRAST_BACKGROUND = T.PRIMARY),
                (T.HIGH_CONTRAST_TEXT = T.BACKGROUND),
                (T.BORDER_HOVER = Object(v.c)(0.5, '#0094FF')),
                (T.BORDER_IDLE = Object(v.c)(0.3, '#0094FF')),
                (T.SHADED = Object(v.a)(0.1, T.BACKGROUND)),
                (T.TEXT = Object(v.c)(0.85, T.PRIMARY)),
                (T.TEXT_FADED = Object(v.c)(0.4, T.TEXT)),
                (T.BORDER_NEUTRAL = Object(v.c)(0.15, T.TEXT));
            var k = { PRIMARY: '#0094FF', BACKGROUND: 'white' };
            (k.HIGH_CONTRAST_BACKGROUND = k.PRIMARY),
                (k.HIGH_CONTRAST_TEXT = k.BACKGROUND),
                (k.BORDER_HOVER = Object(v.b)('#0094FF', 0.5)),
                (k.BORDER_IDLE = Object(v.b)('#0094FF', 0.3)),
                (k.BORDER_NEUTRAL = Object(v.c)(0.75, k.BACKGROUND)),
                (k.SHADED = Object(v.c)(0.95, k.PRIMARY)),
                (k.TEXT = Object(v.c)(0.15, k.PRIMARY)),
                (k.TEXT_FADED = k.BORDER_NEUTRAL);
            var w = { DARK: T, LIGHT: k },
                A = function (n) {
                    return '\n    max(\n        (100vh - '
                        .concat('30px', ') / (')
                        .concat(8, ' * 60) * ')
                        .concat(n, ',\n        ')
                        .concat('30px', ' * 2 * ')
                        .concat(n, ' / 60\n    )\n');
                },
                y = l.d.div(function (n) {
                    var t = n.border,
                        e = void 0 !== t && t,
                        a = n.isFlexible,
                        c = void 0 !== a && a,
                        o = n.margin,
                        r = void 0 === o ? 0 : o,
                        i = n.marginX,
                        s = void 0 === i ? 0 : i,
                        l = n.marginY,
                        u = void 0 === l ? 0 : l,
                        d = n.padding,
                        p = void 0 === d ? 0 : d,
                        f = n.paddingX,
                        b = void 0 === f ? 0 : f,
                        m = n.paddingY,
                        g = void 0 === m ? 0 : m,
                        v = n.theme;
                    return '\n        box-shadow: '
                        .concat(
                            e
                                ? '0 0 0 1px '.concat(w[v.name].BORDER_NEUTRAL)
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
                            u
                                ? '\n                    margin-top: calc('
                                      .concat(u, ' * ')
                                      .concat(
                                          '30px',
                                          ');\n                    margin-bottom: calc('
                                      )
                                      .concat(u, ' * ')
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
                _ = Object(l.d)(y)(function (n) {
                    var t = n.align,
                        e = void 0 === t ? 'center' : t,
                        a = n.direction,
                        c = void 0 === a ? 'row' : a,
                        o = n.isFlexible,
                        r = void 0 !== o && o,
                        i = n.justify,
                        s = void 0 === i ? 'stretch' : i,
                        l = n.spacing,
                        u = void 0 === l ? 0 : l;
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
                            u
                                ? '\n                    & > * + * {\n                        margin-'
                                      .concat(
                                          'row' === c ? 'left' : 'top',
                                          ': calc('
                                      )
                                      .concat(u, ' * ')
                                      .concat(
                                          '30px',
                                          ');\n                    }\n                '
                                      )
                                : '',
                            '\n    '
                        );
                }),
                S = Object(l.d)(_).attrs({
                    direction: 'column',
                    isFlexible: !0,
                })(function (n) {
                    n.theme;
                    return '\n        \n    ';
                }),
                C = Object(l.d)(_).attrs({ direction: 'column' })(function (n) {
                    n.theme;
                    return '\n        height: calc(100vh - '.concat(
                        '30px',
                        ');\n        overflow: auto;\n        position: relative;\n        \n        & > * {\n            align-self: stretch;\n        }\n    '
                    );
                }),
                I = Object(l.d)(_).attrs({ justify: 'center', paddingX: 0.5 })(
                    function (n) {
                        var t = n.theme;
                        return '\n        background: '
                            .concat(w[t.name].BACKGROUND, ';\n        color: ')
                            .concat(
                                w[t.name].TEXT_FADED,
                                ';\n        border-bottom: 2px solid '
                            )
                            .concat(
                                w[t.name].BORDER_NEUTRAL,
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
                        a = Object(b.a)(n, ['children', 'label']);
                    return r.a.createElement(
                        S,
                        null,
                        r.a.createElement(I, null, e),
                        r.a.createElement(C, a, t)
                    );
                },
                B = Object(l.d)(_).attrs({
                    as: 'button',
                    justify: 'center',
                    paddingX: 0.5,
                    paddingY: 0.25,
                })(function (n) {
                    var t = n.theme;
                    return '\n        background: '
                        .concat(w[t.name].PRIMARY, ';\n        border-radius: ')
                        .concat('3px', ';\n        color: ')
                        .concat(
                            w[t.name].TEXT,
                            ';\n        cursor: pointer;\n        transform: scale(1);\n        '
                        )
                        .concat(
                            R,
                            ';\n        \n        &:focus,\n        &:hover {\n            transform: scale(1.1);\n        }\n        &:active {\n            transform: scale(0.9);\n            filter: hue-rotate(20deg);\n        }\n    '
                        );
                }),
                M = Object(l.d)(B)(function (n) {
                    var t = n.theme;
                    return '\n        background: unset; \n        border-radius: '
                        .concat('3px', ';\n        border: 2px dashed ')
                        .concat(
                            w[t.name].BORDER_IDLE,
                            ';\n        width: 100%;\n        \n        &:focus,\n        &:hover {\n            border-color: '
                        )
                        .concat(w[t.name].BORDER_HOVER, ';\n        }\n    ');
                }),
                N = B,
                L = Object(l.d)(_).attrs({
                    justify: 'space-between',
                    paddingX: 1,
                    paddingY: 0.25,
                    spacing: 0.5,
                })(function (n) {
                    var t = n.theme;
                    return '\n        background-color: '
                        .concat(w[t.name].BACKGROUND, ';\n        color: ')
                        .concat(
                            w[t.name].TEXT_FADED,
                            ';\n        width: 100%;\n        z-index: 10;\n        \n        &:hover {\n            color: '
                        )
                        .concat(w[t.name].TEXT, ';\n        }\n    ');
                }),
                H = Object(l.d)(N)(function (n) {
                    var t = n.isSelected;
                    n.theme;
                    return '\n        background: transparent;\n        color: inherit;\n        font-weight: '
                        .concat(t ? 900 : 100, ';\n        opacity: ')
                        .concat(t ? 1 : 0, ';\n        width: auto;\n        ')
                        .concat(R, ';\n        \n        ')
                        .concat(
                            L,
                            ':hover > & {\n            opacity: 1;\n        }\n    '
                        );
                }),
                U = function (n) {
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
                        l = Object(b.a)(n, [
                            'options',
                            'renderOption',
                            'renderSelectedOption',
                            'selectedOption',
                            'onChange',
                        ]);
                    return r.a.createElement(
                        L,
                        l,
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
                X = Object(l.d)(_).attrs({ align: 'flex-start' })(function (n) {
                    var t = n.duration,
                        e = n.isActive,
                        a = n.isDragging,
                        c = n.isDraggingOver,
                        o = n.theme;
                    return '\n        background-color: '
                        .concat(
                            w[o.name].BACKGROUND,
                            ';\n        border-radius: '
                        )
                        .concat(
                            '3px',
                            ';\n        box-shadow: ',
                            '0 0 0 2px '.concat(
                                w[o.name][e ? 'PRIMARY' : 'BORDER_IDLE']
                            ),
                            ';\n        cursor: pointer;\n        height: '
                        )
                        .concat(A(t), ';\n        min-height: ')
                        .concat(A(20), ';\n        opacity: ')
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
                            R,
                            ';\n\n        &:before {\n            background-color: '
                        )
                        .concat(
                            w[o.name].PRIMARY,
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
                            R,
                            ';\n        }\n        \n        &:hover {\n            box-shadow: 0 0 0 2px '
                        )
                        .concat(
                            w[o.name].BORDER_HOVER,
                            ';\n        }\n        \n        &:focus {\n            box-shadow: 0 0 0 2px '
                        )
                        .concat(
                            w[o.name].PRIMARY,
                            ';\n        }\n        \n        &:active {\n            box-shadow: 0 0 0 2px '
                        )
                        .concat(w[o.name].PRIMARY, ' inset;\n        }\n    ');
                }),
                Y = Object(l.d)(_).attrs({ spacing: 0.5 })(function (n) {
                    var t = n.isActive,
                        e = n.theme;
                    return '\n        align-items: center;\n        color: '
                        .concat(
                            w[e.name][t ? 'TEXT' : 'TEXT_FADED'],
                            ';\n        display: flex;\n        justify-content: space-between;\n        height: 100%;\n        '
                        )
                        .concat(R, ';\n        \n        ')
                        .concat(X, ':hover > & {\n            color: ')
                        .concat(w[e.name].TEXT, ';\n        }\n    ');
                }),
                G = function (n) {
                    var t = n.appActions,
                        e = n.isActive,
                        a = n.task,
                        i = Object(b.a)(n, ['appActions', 'isActive', 'task']),
                        s = t.onSelectTask,
                        l = a.icon,
                        u = a.id,
                        d = a.label,
                        p = a.scheduled_minutes,
                        f = (function (n, t) {
                            var e = Object(o.useState)(!1),
                                a = Object(c.a)(e, 2),
                                r = a[0],
                                i = a[1],
                                s = Object(o.useState)(!1),
                                l = Object(c.a)(s, 2),
                                u = l[0],
                                d = l[1];
                            return [
                                {
                                    draggable: !0,
                                    isDragging: r,
                                    isDraggingOver: u,
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
                        })('task-id', u),
                        m = Object(c.a)(f, 1)[0];
                    return r.a.createElement(
                        X,
                        Object.assign(
                            {
                                duration: p,
                                isActive: e,
                                onClick: function () {
                                    return s(u);
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
                            r.a.createElement('span', null, l)
                        )
                    );
                };
            function z() {
                var n = Object(m.a)([
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
            var K = Object(l.d)(F).attrs({ label: 'Backlog' })(function (n) {
                    var t = n.hasTasks,
                        e = (n.isTargetedForDrop, n.theme);
                    return '\n        background-color: '
                        .concat(
                            w[e.name].SHADED,
                            ';\n        flex-grow: 1;\n        overflow: '
                        )
                        .concat(t ? 'auto' : 'visible', ';\n    ');
                }),
                P = Object(l.d)(y).attrs({ isFlexible: !0 })(function (n) {
                    var t = n.isTargetedForDrop,
                        e = n.theme;
                    return '\n        box-shadow: '.concat(
                        t
                            ? '0 0 0 5px '.concat(
                                  w[e.name].BORDER_HOVER,
                                  ' inset'
                              )
                            : 'initial',
                        ';\n        position: relative;\n    '
                    );
                }),
                V = Object(l.d)(y)(z(), '30px'),
                q = function (n) {
                    var t = n.appActions,
                        e = n.appData,
                        a = n.selectedTaskId,
                        o = n.tasks,
                        i =
                            (n.onClickTask,
                            Object(b.a)(n, [
                                'appActions',
                                'appData',
                                'selectedTaskId',
                                'tasks',
                                'onClickTask',
                            ])),
                        s = t.onChangeTheme,
                        l = t.onCreateTask,
                        u = t.onUpdateTask,
                        d = e.theme,
                        p = g('task-id', function (n) {
                            return u(n, { scheduled: !1 });
                        }),
                        f = Object(c.a)(p, 1)[0],
                        m = o.filter(function (n) {
                            return !n.scheduled;
                        }),
                        v = o.length;
                    return r.a.createElement(
                        K,
                        i,
                        r.a.createElement(U, {
                            options: ['DARK', 'LIGHT'],
                            renderOption: function (n) {
                                return n.toLowerCase();
                            },
                            renderSelectedOption: function (n) {
                                return ''.concat(n, ' mode');
                            },
                            selectedOption: d,
                            onChange: s,
                        }),
                        r.a.createElement(
                            P,
                            f,
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
                                        overflow: v ? 'auto' : 'visible',
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
                                    !v &&
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
                                            style: { height: A(30) },
                                            onClick: function () {
                                                return l();
                                            },
                                        },
                                        'New Task'
                                    )
                                ),
                                m.map(function (n) {
                                    return r.a.createElement(G, {
                                        key: n.id,
                                        appActions: t,
                                        isActive: a === n.id,
                                        task: n,
                                    });
                                })
                            )
                        )
                    );
                };
            function J() {
                var n = Object(m.a)([
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
                var n = Object(m.a)([
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
                    return Object(l.e)(
                        W(),
                        w[t.name].PRIMARY,
                        w[t.name].PRIMARY
                    );
                },
                Z = l.d.div(function (n) {
                    var t = n.isDragging,
                        e = n.isTargetedForDrop,
                        a = n.theme;
                    return Object(l.c)(
                        J(),
                        e ? Q : 'unset',
                        Object(v.d)(e ? 0 : t ? 0.35 : 0.8, w[a.name].PRIMARY),
                        '20vw',
                        '20vw',
                        '20vw',
                        t ? 'all' : 'none',
                        '20vw',
                        t ? 0.5 : 0.25,
                        '20vw',
                        R,
                        '\ud83d\uddd1',
                        '20vw',
                        '20vw'
                    );
                }),
                $ = function (n) {
                    var t = n.appActions,
                        e = n.isDragging,
                        a = Object(b.a)(n, ['appActions', 'isDragging']),
                        o = t.onSelectTask,
                        i = t.onUpdateTask,
                        s = g('task-id', function (n) {
                            i(n, { isComplete: !0 }),
                                o(function (t) {
                                    return t === n ? null : t;
                                });
                        }),
                        l = Object(c.a)(s, 1)[0];
                    return r.a.createElement(
                        Z,
                        Object.assign({ isDragging: e }, l, a)
                    );
                },
                nn = e(29),
                tn = e.n(nn),
                en = Object(l.d)(y).attrs({ isFlexible: !0 })(function (n) {
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
                            w[a.name].BORDER_HOVER,
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
                            R,
                            ';\n        }\n        \n        &:hover {\n            &:before {\n                opacity: 1;\n            }\n        }\n    '
                        );
                }),
                an = function (n) {
                    var t = n.isMultiLine,
                        e = void 0 !== t && t,
                        a = n.isRemotelyActivated,
                        i = void 0 !== a && a,
                        s = n.placeholder,
                        l = void 0 === s ? 'Empty' : s,
                        u = n.render,
                        d =
                            void 0 === u
                                ? function (n) {
                                      return n;
                                  }
                                : u,
                        p = n.value,
                        f = void 0 === p ? '' : p,
                        m = n.wrapperStyles,
                        g = void 0 === m ? {} : m,
                        v = n.onSave,
                        h = void 0 === v ? function () {} : v,
                        O = Object(b.a)(n, [
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
                        R = j[1],
                        D = Object(o.useState)(f),
                        T = Object(c.a)(D, 2),
                        k = T[0],
                        w = T[1],
                        A = Object(o.useState)(null),
                        _ = Object(c.a)(A, 2),
                        S = _[0],
                        C = _[1],
                        I = Object(o.useRef)(null),
                        F = Object(o.useRef)(null),
                        B = '' === k.trim();
                    Object(o.useEffect)(
                        function () {
                            !0 === i && M();
                        },
                        [i]
                    ),
                        Object(o.useEffect)(
                            function () {
                                w(f);
                            },
                            [f]
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
                    var M = function () {
                        w(f), R(!0);
                    };
                    return r.a.createElement(
                        en,
                        Object.assign(
                            { isEditing: x, isEmpty: B, onClick: M },
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
                                              h(k), R(!1);
                                          },
                                          onChange: function (n) {
                                              w(n.target.value);
                                          },
                                          onKeyDown: function (n) {
                                              return 'Escape' === n.key
                                                  ? (w(f), void R(!1))
                                                  : 'Enter' !== n.key ||
                                                    ((n.metaKey ||
                                                        n.shiftKey ||
                                                        !e) &&
                                                        (h(k), R(!1)),
                                                    e)
                                                  ? void 0
                                                  : (n.preventDefault(), !1);
                                          },
                                      })
                                  )
                                : d(B ? l : f)
                        )
                    );
                };
            function cn() {
                var n = Object(m.a)([
                    '\n    flex-grow: 0;\n    flex-shrink: 0;\n    font-size: 3rem;\n    line-height: 1.4rem;\n    width: 3rem;\n',
                ]);
                return (
                    (cn = function () {
                        return n;
                    }),
                    n
                );
            }
            function on() {
                var n = Object(m.a)([
                    '\n    flex-grow: 1;\n    flex-shrink: 1;\n    justify-self: stretch;\n',
                ]);
                return (
                    (on = function () {
                        return n;
                    }),
                    n
                );
            }
            var rn = Object(l.d)(F)(function (n) {
                    var t = n.isLoading,
                        e = n.theme;
                    return '\n        box-shadow: 0 0 0 10px rgba(0, 0, 0, 0.1);\n        border-left: 2px solid '
                        .concat(
                            w[e.name].BORDER_NEUTRAL,
                            ';\n        border-right: 2px solid '
                        )
                        .concat(
                            w[e.name].BORDER_NEUTRAL,
                            ';\n        overflow: unset;\n        z-index: 11;\n        \n        // Blackout curtain\n        &:before {\n            background-color: '
                        )
                        .concat(
                            w[e.name].BACKGROUND,
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
                sn = Object(l.d)(_).attrs({
                    as: 'h1',
                    align: 'flex-start',
                    spacing: 1.5,
                    paddingX: 1,
                    paddingY: 0.75,
                })(function (n) {
                    var t = n.theme;
                    return '\n        background-color: '.concat(
                        w[t.name].SHADED,
                        ';\n        font-size: 1.4rem;\n        font-weight: 900;\n        position: relative;\n    '
                    );
                }),
                ln = Object(l.d)(y)(on()),
                un = Object(l.d)(y).attrs({ role: 'img' })(cn()),
                dn = function (n) {
                    var t = n.appActions,
                        e = void 0 === t ? {} : t,
                        a = (n.appData, n.isCreatingTask),
                        i = void 0 !== a && a,
                        s = n.task,
                        l = void 0 === s ? {} : s,
                        u = Object(b.a)(n, [
                            'appActions',
                            'appData',
                            'isCreatingTask',
                            'task',
                        ]),
                        d = Object(o.useState)(!1),
                        p = Object(c.a)(d, 2),
                        f = p[0],
                        m = p[1],
                        g = e.onUpdateTask,
                        v = l.icon,
                        E = l.id,
                        j = l.label,
                        x = l.notes,
                        R = l.scheduled_minutes,
                        T = !l.id,
                        k = function (n, t) {
                            return g(E, { [n]: t });
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
                            [l.id]
                        ),
                        r.a.createElement(
                            rn,
                            Object.assign(
                                {
                                    isLoading: f,
                                    label: 'Selected Task Details',
                                },
                                u
                            ),
                            !T &&
                                !f &&
                                r.a.createElement(
                                    r.a.Fragment,
                                    null,
                                    r.a.createElement(U, {
                                        renderSelectedOption: function (n) {
                                            return ''.concat(n, ' mins');
                                        },
                                        selectedOption: R,
                                        options: O,
                                        onChange: function (n) {
                                            return k('scheduled_minutes', n);
                                        },
                                    }),
                                    r.a.createElement(
                                        sn,
                                        null,
                                        r.a.createElement(
                                            ln,
                                            null,
                                            r.a.createElement(an, {
                                                isRemotelyActivated: i,
                                                placeholder: D.empty_label,
                                                value: j,
                                                onSave: function (n) {
                                                    return k('label', n);
                                                },
                                            })
                                        ),
                                        r.a.createElement(
                                            un,
                                            null,
                                            r.a.createElement(an, {
                                                placeholder: h,
                                                value: v,
                                                onSave: function (n) {
                                                    return k('icon', n);
                                                },
                                            })
                                        )
                                    ),
                                    r.a.createElement(an, {
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
                pn = e(9),
                fn = e.n(pn),
                bn = function (n) {
                    return n
                        ? n.split(':').map(function (n) {
                              return parseInt(n, 10);
                          })
                        : [0, 0];
                };
            function mn() {
                var n = Object(m.a)([
                    '\n    bottom: 0;\n    height: 100%;\n    left: 0;\n    position: absolute;\n    right: 0;\n    top: 0;\n    width: 100%;\n',
                ]);
                return (
                    (mn = function () {
                        return n;
                    }),
                    n
                );
            }
            var gn = l.d.div(mn()),
                vn = l.d.div(function (n) {
                    var t = n.isTargetedForDrop,
                        e = n.theme;
                    return '\n        position: relative;\n        width: 100%;\n        height: '
                        .concat(
                            A(15),
                            ';\n        z-index: 1;\n        border-top: '
                        )
                        .concat(
                            t ? '4px dotted '.concat(w[e.name].PRIMARY) : '',
                            ';\n    '
                        );
                }),
                hn = function (n) {
                    var t,
                        e = n.appActions,
                        a = n.quarterInMinutes,
                        o = Object(b.a)(n, ['appActions', 'quarterInMinutes']),
                        i = e.onUpdateTask,
                        s = bn(j),
                        l = Object(c.a)(s, 2),
                        u = l[0],
                        d = l[1],
                        p =
                            ((t = 60 * u + d + 15 * a),
                            ''.concat(Math.floor(t / 60), ':').concat(t % 60)),
                        f = g('task-id', function (n) {
                            return i(n, { scheduled: !0, scheduled_time: p });
                        }),
                        m = Object(c.a)(f, 1)[0];
                    return r.a.createElement(vn, Object.assign({}, m, o));
                },
                On = function (n) {
                    var t = n.appActions,
                        e = n.totalMinutes,
                        a = Object(b.a)(n, ['appActions', 'totalMinutes']);
                    return r.a.createElement(
                        gn,
                        a,
                        fn()(e / 15).map(function (n) {
                            return r.a.createElement(hn, {
                                key: n,
                                appActions: t,
                                quarterInMinutes: n,
                            });
                        })
                    );
                };
            function En() {
                var n = Object(m.a)([
                    '\n    position: relative;\n    height: ',
                    ';\n',
                ]);
                return (
                    (En = function () {
                        return n;
                    }),
                    n
                );
            }
            function jn() {
                var n = Object(m.a)(['']);
                return (
                    (jn = function () {
                        return n;
                    }),
                    n
                );
            }
            var xn = Object(l.d)(F).attrs({ label: "Today's Plan" })(jn()),
                Rn = l.d.div(function (n) {
                    var t = n.isTargetedForDrop,
                        e = n.theme;
                    return '\n        bottom: 0;\n        box-shadow: '.concat(
                        t
                            ? '0 0 0 5px '.concat(
                                  w[e.name].BORDER_HOVER,
                                  ' inset'
                              )
                            : 'initial',
                        ';\n        left: 0;\n        overflow: auto;\n        position: absolute;\n        right: 0;\n        top: 0;\n        user-select: none;\n    '
                    );
                }),
                Dn = l.d.div(En(), A(30)),
                Tn = l.d.div(function (n) {
                    var t = n.hideLabel,
                        e = n.isFaded,
                        a = n.theme;
                    return '\n        color: '
                        .concat(
                            t
                                ? 'transparent'
                                : Object(v.d)(e ? 1 : 0, w[a.name].TEXT_FADED),
                            ';\n        padding-right: calc(100% - '
                        )
                        .concat('80px', ' + (')
                        .concat(
                            '30px',
                            ' * 0.5));\n        position: absolute;\n        text-align: right;\n        top: 0;\n        transform: translateY(-50%);\n        width: 100%;\n\n        &:before {\n            background-color: '
                        )
                        .concat(
                            Object(v.d)(
                                e ? 0.8 : 0.5,
                                w[a.name].BORDER_NEUTRAL
                            ),
                            ";\n            content: '';\n            height: 1px;\n            left: "
                        )
                        .concat(
                            '80px',
                            ';\n            position: absolute;\n            right: 0;\n            top: 50%;\n        }\n    '
                        );
                }),
                kn = Object(l.d)(G)(function (n) {
                    var t = n.offsetMinutes;
                    return '\n        position: absolute;\n        left: calc('
                        .concat('30px', ' * 3);\n        right: ')
                        .concat('30px', ';\n        top: ')
                        .concat(
                            A(t),
                            ';\n        width: auto;\n        z-index: 2;\n    '
                        );
                }),
                wn = l.d.div(function (n) {
                    var t = n.offsetMinutes;
                    return '\n        background-color: red;\n        height: 1px;\n        left: 0;\n        pointer-events: none;\n        position: absolute;\n        right: 0;\n        top: '.concat(
                        A(t),
                        ';\n        z-index: 10;\n    '
                    );
                }),
                An = function (n) {
                    var t = n.appActions,
                        e = n.selectedTaskId,
                        a = n.from,
                        i = n.tasks,
                        s = n.to,
                        l =
                            (n.onClickTask,
                            Object(b.a)(n, [
                                'appActions',
                                'selectedTaskId',
                                'from',
                                'tasks',
                                'to',
                                'onClickTask',
                            ])),
                        u = Object(o.useState)(null),
                        d = Object(c.a)(u, 2),
                        p = d[0],
                        f = d[1],
                        m = bn(p),
                        g = Object(c.a)(m, 2),
                        v = g[0],
                        h = g[1],
                        O = bn(a),
                        E = Object(c.a)(O, 2),
                        j = E[0],
                        x = E[1],
                        R = Object(o.useState)(!1),
                        D = Object(c.a)(R, 2),
                        T = D[0],
                        k = D[1],
                        w = i.filter(function (n) {
                            return n.scheduled;
                        }),
                        A = bn(s),
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
                            f(
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
                        xn,
                        l,
                        r.a.createElement(
                            Rn,
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
                                var a = bn(n.scheduled_time),
                                    o = Object(c.a)(a, 2),
                                    i = 60 * o[0] + o[1] - (60 * j + x);
                                return r.a.createElement(kn, {
                                    key: n.id,
                                    appActions: t,
                                    isActive: e === n.id,
                                    offsetMinutes: i,
                                    task: n,
                                });
                            }),
                            r.a.createElement(wn, {
                                ref: F,
                                offsetMinutes: 60 * v + h - (60 * j + x),
                            }),
                            r.a.createElement(On, {
                                appActions: t,
                                totalMinutes: I,
                            }),
                            fn()(C).map(function (n) {
                                return r.a.createElement(
                                    o.Fragment,
                                    { key: n },
                                    r.a.createElement(
                                        Dn,
                                        null,
                                        r.a.createElement(
                                            Tn,
                                            { hideLabel: 0 === n },
                                            (j + n) % 12 || 12,
                                            ':00'
                                        )
                                    ),
                                    r.a.createElement(
                                        Dn,
                                        null,
                                        r.a.createElement(
                                            Tn,
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
                yn = Object(l.b)(function (n) {
                    var t = n.theme;
                    return '\n        * {\n            background: unset;\n            border: unset;\n            box-sizing: border-box;\n            color: unset;\n            font: unset;\n            font-size: inherit;\n            line-height: 1.4em;\n            list-style-type: none;\n            margin: 0;\n            outline: unset;\n            padding: 0;\n        }\n        :root {\n            background: '
                        .concat(w[t.name].BACKGROUND, ';\n            color: ')
                        .concat(
                            w[t.name].TEXT,
                            ";\n            font-family: 'Operator Mono', monospace;\n            font-size: 15px;\n            font-weight: 300;\n            height: 100%;\n            overflow: hidden;\n        }\n        strong {\n            font-weight: 900;\n        }\n        em {\n            font-style: italic;\n        }\n        \n        .markdown {\n            * + * {\n                margin-top: calc("
                        )
                        .concat(
                            '30px',
                            ' * 0.5);\n            }\n            \n            h1 {\n                color: '
                        )
                        .concat(
                            w[t.name].TEXT_FADED,
                            ';\n                font-size: 1.4rem;\n                font-weight: 500;\n                border-bottom: 2px dotted '
                        )
                        .concat(
                            w[t.name].TEXT_FADED,
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
                            w[t.name].TEXT_FADED,
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
                            w[t.name].TEXT_FADED,
                            ';\n                    border-radius: 100px;\n                    width: '
                        )
                        .concat('10px', ';\n                    height: ')
                        .concat(
                            '10px',
                            ';\n                }\n            }\n        }\n    '
                        );
                }),
                _n = function (n, t) {
                    var e = Object(o.useState)(!1),
                        a = Object(c.a)(e, 2),
                        r = a[0],
                        i = a[1],
                        s = Object(o.useState)(t),
                        l = Object(c.a)(s, 2),
                        u = l[0],
                        d = l[1];
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
                                        JSON.stringify(u)
                                    );
                            },
                            [r, n, u]
                        ),
                        [u, d]
                    );
                };
            function Sn() {
                var n = _n('tasks', E),
                    t = Object(c.a)(n, 2),
                    e = t[0],
                    i = t[1],
                    s = _n('theme-name', 'DARK'),
                    u = Object(c.a)(s, 2),
                    p = u[0],
                    b = u[1],
                    m = _n('selected-task-id', null),
                    g = Object(c.a)(m, 2),
                    v = g[0],
                    O = g[1],
                    R = Object(o.useState)(!1),
                    T = Object(c.a)(R, 2),
                    k = T[0],
                    w = T[1],
                    A = Object(o.useState)(!1),
                    y = Object(c.a)(A, 2),
                    S = y[0],
                    C = y[1],
                    I = Object(o.useRef)(null),
                    F = e[v],
                    B = f()(e).filter(function (n) {
                        return !n.isComplete;
                    }),
                    M = B.length,
                    N = function () {
                        return C(!1);
                    };
                Object(o.useEffect)(
                    function () {
                        N();
                    },
                    [e]
                );
                var L = function (n) {
                        i(function (t) {
                            return Object(a.a)(Object(a.a)({}, t), n);
                        });
                    },
                    H = {
                        onChangeTheme: b,
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
                            L({
                                [t]: Object(a.a)(
                                    {
                                        icon: h,
                                        id: t,
                                        isComplete: !1,
                                        label: ''
                                            .concat(
                                                d()(D.motivational_descriptors),
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
                            }),
                                O(t),
                                w(!0);
                        },
                        onSelectTask: O,
                        onUpdateTask: function (n, t) {
                            i(function (e) {
                                return Object(a.a)(
                                    Object(a.a)({}, e),
                                    {},
                                    {
                                        [n]: Object(a.a)(
                                            Object(a.a)({}, e[n]),
                                            t
                                        ),
                                    }
                                );
                            });
                        },
                        onUpdateTasks: L,
                    },
                    U = {
                        selectedTaskId: v,
                        taskLabelElementRef: I,
                        tasks: e,
                        theme: p,
                    };
                return r.a.createElement(
                    l.a,
                    { theme: { name: p } },
                    r.a.createElement(yn, null),
                    r.a.createElement($, { appActions: H, isDragging: S }),
                    r.a.createElement(
                        _,
                        {
                            align: 'stretch',
                            direction: 'row-reverse',
                            onDragOver: function () {
                                return C(!0);
                            },
                            onDragEnd: N,
                        },
                        r.a.createElement(An, {
                            appActions: H,
                            selectedTaskId: v,
                            from: j,
                            style: {
                                opacity: M ? 1 : 0.25,
                                width: '30vw',
                                pointerEvents: M ? 'all' : 'none',
                            },
                            tasks: B,
                            to: x,
                        }),
                        r.a.createElement(dn, {
                            appActions: H,
                            appData: U,
                            task: F,
                            isCreatingTask: k,
                            style: { width: '40vw', opacity: M ? 1 : 0.25 },
                        }),
                        r.a.createElement(q, {
                            appActions: H,
                            appData: U,
                            selectedTaskId: v,
                            style: { width: '30vw' },
                            tasks: B,
                        })
                    )
                );
            }
            var Cn = document.getElementById('root');
            s.a.render(r.a.createElement(Sn, null), Cn);
        },
    },
    [[32, 1, 2]],
]);
//# sourceMappingURL=main.fa4501fd.chunk.js.map
