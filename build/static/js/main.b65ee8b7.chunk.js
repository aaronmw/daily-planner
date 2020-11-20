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
                i = e(54),
                s = e.n(i),
                l = e(1),
                u = e(29),
                d = e.n(u),
                p = e(3),
                f = e(5),
                b = function (n) {
                    var t =
                            arguments.length > 1 && void 0 !== arguments[1]
                                ? arguments[1]
                                : function () {},
                        e = Object(o.useState)(!1),
                        a = Object(c.a)(e, 2),
                        r = a[0],
                        i = a[1],
                        s = Object(o.useRef)(null);
                    return [
                        {
                            isTargetedForDrop: r,
                            droppable: !0,
                            onDragEnter: function (n) {
                                n.preventDefault(),
                                    (s.current = n.target),
                                    r || i(!0);
                            },
                            onDragOver: function (n) {
                                n.preventDefault();
                            },
                            onDragLeave: function (n) {
                                n.target === s.current && i(!1);
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
                O = [{ id: 1, label: 'Default List' }],
                v = [],
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
                T = { PRIMARY: '#0094FF', BACKGROUND: '#000209' };
            (T.HIGH_CONTRAST_BACKGROUND = T.PRIMARY),
                (T.HIGH_CONTRAST_TEXT = T.BACKGROUND),
                (T.BORDER_HOVER = Object(m.c)(0.5, '#0094FF')),
                (T.BORDER_IDLE = Object(m.c)(0.3, '#0094FF')),
                (T.SHADED = Object(m.a)(0.1, T.BACKGROUND)),
                (T.TEXT = Object(m.c)(0.85, T.PRIMARY)),
                (T.TEXT_FADED = Object(m.c)(0.4, T.TEXT)),
                (T.BORDER_NEUTRAL = Object(m.c)(0.15, T.TEXT));
            var k = { PRIMARY: '#0094FF', BACKGROUND: 'white' };
            (k.HIGH_CONTRAST_BACKGROUND = k.PRIMARY),
                (k.HIGH_CONTRAST_TEXT = k.BACKGROUND),
                (k.BORDER_HOVER = Object(m.b)('#0094FF', 0.5)),
                (k.BORDER_IDLE = Object(m.b)('#0094FF', 0.3)),
                (k.BORDER_NEUTRAL = Object(m.c)(0.75, k.BACKGROUND)),
                (k.SHADED = Object(m.c)(0.95, k.PRIMARY)),
                (k.TEXT = Object(m.c)(0.15, k.PRIMARY)),
                (k.TEXT_FADED = k.BORDER_NEUTRAL);
            var R = { DARK: T, LIGHT: k },
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
                        h = n.theme;
                    return '\n        box-shadow: '
                        .concat(
                            e
                                ? '0 0 0 1px '.concat(R[h.name].BORDER_NEUTRAL)
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
                C = Object(l.d)(_).attrs({
                    direction: 'column',
                    isFlexible: !0,
                })(function (n) {
                    n.theme;
                    return '\n        \n    ';
                }),
                I = Object(l.d)(_).attrs({ direction: 'column' })(function (n) {
                    n.theme;
                    return '\n        height: calc(100vh - '.concat(
                        '30px',
                        ');\n        overflow: auto;\n        position: relative;\n        \n        & > * {\n            align-self: stretch;\n        }\n    '
                    );
                }),
                S = Object(l.d)(_).attrs({ justify: 'center', paddingX: 0.5 })(
                    function (n) {
                        var t = n.theme;
                        return '\n        background: '
                            .concat(R[t.name].BACKGROUND, ';\n        color: ')
                            .concat(
                                R[t.name].TEXT_FADED,
                                ';\n        border-bottom: 2px solid '
                            )
                            .concat(
                                R[t.name].BORDER_NEUTRAL,
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
                        C,
                        null,
                        r.a.createElement(S, null, e),
                        r.a.createElement(I, a, t)
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
                        .concat(R[t.name].PRIMARY, ';\n        border-radius: ')
                        .concat('3px', ';\n        color: ')
                        .concat(
                            R[t.name].TEXT,
                            ';\n        cursor: pointer;\n        transform: scale(1);\n        '
                        )
                        .concat(
                            x,
                            ';\n        \n        &:focus,\n        &:hover {\n            transform: scale(1.1);\n        }\n        &:active {\n            transform: scale(0.9);\n            filter: hue-rotate(20deg);\n        }\n    '
                        );
                }),
                M = Object(l.d)(B)(function (n) {
                    var t = n.theme;
                    return '\n        background: unset; \n        border-radius: '
                        .concat('3px', ';\n        border: 2px dashed ')
                        .concat(
                            R[t.name].BORDER_IDLE,
                            ';\n        width: 100%;\n        \n        &:focus,\n        &:hover {\n            border-color: '
                        )
                        .concat(R[t.name].BORDER_HOVER, ';\n        }\n    ');
                }),
                N = B,
                H = Object(l.d)(_).attrs({
                    justify: 'space-between',
                    paddingX: 1,
                    paddingY: 0.25,
                    spacing: 0.5,
                })(function (n) {
                    var t = n.theme;
                    return '\n        background-color: '
                        .concat(R[t.name].BACKGROUND, ';\n        color: ')
                        .concat(
                            R[t.name].TEXT_FADED,
                            ';\n        width: 100%;\n        z-index: 10;\n        \n        &:hover {\n            color: '
                        )
                        .concat(R[t.name].TEXT, ';\n        }\n    ');
                }),
                L = Object(l.d)(N)(function (n) {
                    var t = n.isSelected;
                    n.theme;
                    return '\n        background: transparent;\n        color: inherit;\n        font-weight: '
                        .concat(t ? 900 : 100, ';\n        opacity: ')
                        .concat(t ? 1 : 0, ';\n        width: auto;\n        ')
                        .concat(x, ';\n        \n        ')
                        .concat(
                            H,
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
                        l = Object(p.a)(n, [
                            'options',
                            'renderOption',
                            'renderSelectedOption',
                            'selectedOption',
                            'onChange',
                        ]);
                    return r.a.createElement(
                        H,
                        l,
                        t.map(function (n) {
                            var t = n === i;
                            return r.a.createElement(
                                L,
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
                U = Object(l.d)(_).attrs({ align: 'flex-start' })(function (n) {
                    var t = n.duration,
                        e = n.isActive,
                        a = n.isDragging,
                        c = n.isDraggingTask,
                        o = n.theme;
                    return '\n        background-color: '
                        .concat(
                            R[o.name].BACKGROUND,
                            ';\n        border-radius: '
                        )
                        .concat(
                            '3px',
                            ';\n        box-shadow: ',
                            '0 0 0 2px '.concat(
                                R[o.name][e ? 'PRIMARY' : 'BORDER_IDLE']
                            ),
                            ';\n        cursor: pointer;\n        height: '
                        )
                        .concat(w(t), ';\n        min-height: ')
                        .concat(w(20), ';\n        opacity: ')
                        .concat(a ? 0.5 : 1, ';\n        padding: 0 calc(')
                        .concat('30px', ' / 2) 0\n            calc(')
                        .concat('30px', ' / 2 + ')
                        .concat(
                            '5px',
                            ');\n        position: relative;\n        pointer-events: '
                        )
                        .concat(
                            c ? 'none' : 'all',
                            ';\n        transition-property: opacity, top;\n        width: 100%;\n        z-index: '
                        )
                        .concat(e ? 10 : 'initial', ';\n        ')
                        .concat(
                            x,
                            ';\n\n        &:before {\n            background-color: '
                        )
                        .concat(
                            R[o.name].PRIMARY,
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
                            R[o.name].BORDER_HOVER,
                            ';\n        }\n        \n        &:focus {\n            box-shadow: 0 0 0 2px '
                        )
                        .concat(
                            R[o.name].PRIMARY,
                            ';\n        }\n        \n        &:active {\n            box-shadow: 0 0 0 2px '
                        )
                        .concat(R[o.name].PRIMARY, ' inset;\n        }\n    ');
                }),
                Y = Object(l.d)(_).attrs({ spacing: 0.5 })(function (n) {
                    var t = n.isActive,
                        e = n.theme;
                    return '\n        align-items: center;\n        color: '
                        .concat(
                            R[e.name][t ? 'TEXT' : 'TEXT_FADED'],
                            ';\n        display: flex;\n        justify-content: space-between;\n        height: 100%;\n        '
                        )
                        .concat(x, ';\n        \n        ')
                        .concat(U, ':hover > & {\n            color: ')
                        .concat(R[e.name].TEXT, ';\n        }\n    ');
                }),
                G = Object(o.memo)(function (n) {
                    var t = n.appActions,
                        e = n.appData,
                        a = n.isActive,
                        i = n.task,
                        s = Object(p.a)(n, [
                            'appActions',
                            'appData',
                            'isActive',
                            'task',
                        ]),
                        l = t.onSelectTask,
                        u = e.isDraggingTask,
                        d = i.icon,
                        f = i.id,
                        b = i.label,
                        m = i.scheduled_minutes,
                        g = (function (n, t) {
                            var e = Object(o.useState)(!1),
                                a = Object(c.a)(e, 2),
                                r = a[0],
                                i = a[1];
                            return [
                                {
                                    draggable: !0,
                                    isDragging: r,
                                    onDragEnd: function () {
                                        i(!1);
                                    },
                                    onDragStart: function (e) {
                                        e.dataTransfer.setData(n, t), i(!0);
                                    },
                                },
                            ];
                        })('task-id', f),
                        h = Object(c.a)(g, 1)[0];
                    return r.a.createElement(
                        U,
                        Object.assign(
                            {
                                'data-task-id': f,
                                duration: m,
                                isActive: a,
                                isDraggingTask: u,
                                tabIndex: 0,
                                onClick: function () {
                                    return l(f);
                                },
                            },
                            h,
                            s
                        ),
                        r.a.createElement(
                            Y,
                            { isActive: a },
                            r.a.createElement(
                                'div',
                                {
                                    style: {
                                        maxHeight: '100%',
                                        overflow: 'auto',
                                    },
                                },
                                b
                            ),
                            r.a.createElement('span', null, d)
                        )
                    );
                });
            function P() {
                var n = Object(f.a)([
                    '\n    position: absolute;\n    left: calc(100% + ',
                    ' * 2);\n    top: 50%;\n    transform: translateY(-50%);\n    white-space: nowrap;\n',
                ]);
                return (
                    (P = function () {
                        return n;
                    }),
                    n
                );
            }
            var z = Object(l.d)(F).attrs({ label: 'Backlog' })(function (n) {
                    var t = n.hasTasks,
                        e = n.theme;
                    return '\n        background-color: '
                        .concat(
                            R[e.name].SHADED,
                            ';\n        flex-grow: 1;\n        overflow: '
                        )
                        .concat(t ? 'auto' : 'visible', ';\n    ');
                }),
                K = Object(l.d)(y).attrs({ isFlexible: !0 })(function (n) {
                    var t = n.isTargetedForDrop,
                        e = n.theme;
                    return '\n        box-shadow: '.concat(
                        t
                            ? '0 0 0 5px '.concat(
                                  R[e.name].BORDER_HOVER,
                                  ' inset'
                              )
                            : 'initial',
                        ';\n        position: relative;\n    '
                    );
                }),
                V = Object(l.d)(y)(P(), '30px'),
                q = Object(o.memo)(function (n) {
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
                        l = t.onChangeTheme,
                        u = t.onCreateTask,
                        d = t.onUpdateTask,
                        f = e.theme,
                        m = b('task-id', function (n) {
                            d(n, { scheduled: !1 }), s(n, 0);
                        }),
                        g = Object(c.a)(m, 1)[0],
                        h = b('task-id', function (n, t) {
                            t.stopPropagation();
                            var a = A(t.currentTarget.dataset.taskId),
                                c = e.tasks.findIndex(function (n) {
                                    return n.id === a;
                                });
                            s(n, c);
                        }),
                        O = Object(c.a)(h, 1)[0],
                        v = o.filter(function (n) {
                            return !n.scheduled;
                        }),
                        E = o.length;
                    return r.a.createElement(
                        z,
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
                            onChange: l,
                        }),
                        r.a.createElement(
                            K,
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
                                                return u();
                                            },
                                        },
                                        'New Task'
                                    )
                                ),
                                v.map(function (n) {
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
                                            O
                                        )
                                    );
                                })
                            )
                        )
                    );
                });
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
                    return Object(l.e)(
                        W(),
                        R[t.name].PRIMARY,
                        R[t.name].PRIMARY
                    );
                },
                Z = l.d.div(function (n) {
                    var t = n.isDraggingTask,
                        e = n.isTargetedForDrop,
                        a = n.theme;
                    return Object(l.c)(
                        J(),
                        e ? Q : 'unset',
                        Object(m.d)(e ? 0 : t ? 0.35 : 0.8, R[a.name].PRIMARY),
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
                        e = n.appData,
                        a = Object(p.a)(n, ['appActions', 'appData']),
                        o = t.onSelectTask,
                        i = t.onUpdateTask,
                        s = e.isDraggingTask,
                        l = b('task-id', function (n) {
                            i(n, { isComplete: !0 }),
                                o(function (t) {
                                    return t === n ? null : t;
                                });
                        }),
                        u = Object(c.a)(l, 1)[0];
                    return r.a.createElement(
                        Z,
                        Object.assign({ isDraggingTask: s }, u, a)
                    );
                },
                nn = e(57),
                tn = e.n(nn),
                en = e(58),
                an = e.n(en),
                cn = e(59),
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
                sn = Object(l.d)(y).attrs({ isFlexible: !0 })(function (n) {
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
                            R[a.name].BORDER_HOVER,
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
                ln = Object(o.memo)(function (n) {
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
                        f = n.value,
                        b = void 0 === f ? '' : f,
                        m = n.wrapperStyles,
                        g = void 0 === m ? {} : m,
                        h = n.onSave,
                        O = void 0 === h ? function () {} : h,
                        v = Object(p.a)(n, [
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
                        T = Object(o.useState)(b),
                        k = Object(c.a)(T, 2),
                        R = k[0],
                        w = k[1],
                        A = Object(o.useState)(null),
                        _ = Object(c.a)(A, 2),
                        C = _[0],
                        I = _[1],
                        S = Object(o.useRef)(null),
                        F = Object(o.useRef)(null),
                        B = '' === R.trim(),
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
                                    S.current &&
                                    (S.current.select(), S.current.focus());
                            },
                            [S, x]
                        ),
                        Object(o.useEffect)(
                            function () {
                                var n = F.current;
                                n && I(n.offsetHeight);
                            },
                            [R, x, F]
                        );
                    var N = function () {
                            x || (w(b), D(!0));
                        },
                        H = function () {
                            O(R), D(!1);
                        },
                        L = function () {
                            w(b), D(!1);
                        },
                        X = rn({
                            'cmd+escape': L,
                            'shift+escape': L,
                            'cmd+enter': H,
                            'shift+enter': H,
                            escape: H,
                            enter: function (n) {
                                M &&
                                    (H(),
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
                            v
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
                                          R,
                                          '.'
                                      ),
                                      r.a.createElement('textarea', {
                                          disabled: !x,
                                          ref: S,
                                          rows: 1,
                                          style: {
                                              display: 'block',
                                              height: ''.concat(C, 'px'),
                                              width: '100%',
                                          },
                                          value: R,
                                          onBlur: function () {
                                              O(R), D(!1);
                                          },
                                          onChange: function (n) {
                                              w(n.target.value);
                                          },
                                          onKeyDown: U,
                                      })
                                  )
                                : d(B ? l : b)
                        )
                    );
                });
            function un() {
                var n = Object(f.a)([
                    '\n    flex-grow: 0;\n    flex-shrink: 0;\n    font-size: 3rem;\n    line-height: 1.4rem;\n    width: 3rem;\n',
                ]);
                return (
                    (un = function () {
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
            var pn = Object(l.d)(F)(function (n) {
                    var t = n.isLoading,
                        e = n.theme;
                    return '\n        box-shadow: 0 0 0 10px rgba(0, 0, 0, 0.1);\n        border-left: 2px solid '
                        .concat(
                            R[e.name].BORDER_NEUTRAL,
                            ';\n        border-right: 2px solid '
                        )
                        .concat(
                            R[e.name].BORDER_NEUTRAL,
                            ';\n        overflow: unset;\n        z-index: 11;\n        \n        // Blackout curtain\n        &:before {\n            background-color: '
                        )
                        .concat(
                            R[e.name].BACKGROUND,
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
                fn = Object(l.d)(_).attrs({
                    as: 'h1',
                    align: 'flex-start',
                    spacing: 1.5,
                    paddingX: 1,
                    paddingY: 0.75,
                })(function (n) {
                    var t = n.theme;
                    return '\n        background-color: '.concat(
                        R[t.name].SHADED,
                        ';\n        font-size: 1.4rem;\n        font-weight: 900;\n        position: relative;\n    '
                    );
                }),
                bn = Object(l.d)(y)(dn()),
                mn = Object(l.d)(y).attrs({ role: 'img' })(un()),
                gn = function (n) {
                    var t = n.appActions,
                        e = void 0 === t ? {} : t,
                        a = (n.appData, n.isCreatingTask),
                        i = void 0 !== a && a,
                        s = n.task,
                        l = void 0 === s ? {} : s,
                        u = Object(p.a)(n, [
                            'appActions',
                            'appData',
                            'isCreatingTask',
                            'task',
                        ]),
                        d = Object(o.useState)(!1),
                        f = Object(c.a)(d, 2),
                        b = f[0],
                        m = f[1],
                        O = e.onUpdateTask,
                        v = l.icon,
                        E = l.id,
                        j = l.label,
                        x = l.notes,
                        T = l.scheduled_minutes,
                        k = !l.id,
                        R = function (n, t) {
                            return O(E, { [n]: t });
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
                            pn,
                            Object.assign(
                                {
                                    isLoading: b,
                                    label: 'Selected Task Details',
                                },
                                u
                            ),
                            !k &&
                                !b &&
                                r.a.createElement(
                                    r.a.Fragment,
                                    null,
                                    r.a.createElement(X, {
                                        renderSelectedOption: function (n) {
                                            return ''.concat(n, ' mins');
                                        },
                                        selectedOption: T,
                                        options: h,
                                        onChange: function (n) {
                                            return R('scheduled_minutes', n);
                                        },
                                    }),
                                    r.a.createElement(
                                        fn,
                                        null,
                                        r.a.createElement(
                                            bn,
                                            null,
                                            r.a.createElement(ln, {
                                                isRemotelyActivated: i,
                                                placeholder: D.empty_label,
                                                value: j,
                                                onSave: function (n) {
                                                    return R('label', n);
                                                },
                                            })
                                        ),
                                        r.a.createElement(
                                            mn,
                                            null,
                                            r.a.createElement(ln, {
                                                placeholder: g,
                                                value: v,
                                                onSave: function (n) {
                                                    return R('icon', n);
                                                },
                                            })
                                        )
                                    ),
                                    r.a.createElement(ln, {
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
                                            return R('notes', n);
                                        },
                                    })
                                )
                        )
                    );
                },
                hn = e(20),
                On = e.n(hn),
                vn = function (n) {
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
            var jn = l.d.div(En()),
                xn = l.d.div(function (n) {
                    var t = n.isTargetedForDrop,
                        e = n.theme;
                    return '\n        position: relative;\n        width: 100%;\n        height: '
                        .concat(
                            w(15),
                            ';\n        z-index: 1;\n        border-top: '
                        )
                        .concat(
                            t ? '4px dotted '.concat(R[e.name].PRIMARY) : '',
                            ';\n    '
                        );
                }),
                Dn = Object(o.memo)(function (n) {
                    var t,
                        e = n.appActions,
                        a = n.quarterInMinutes,
                        o = Object(p.a)(n, ['appActions', 'quarterInMinutes']),
                        i = e.onUpdateTask,
                        s = vn(E),
                        l = Object(c.a)(s, 2),
                        u = l[0],
                        d = l[1],
                        f =
                            ((t = 60 * u + d + 15 * a),
                            ''.concat(Math.floor(t / 60), ':').concat(t % 60)),
                        m = b('task-id', function (n) {
                            return i(n, { scheduled: !0, scheduled_time: f });
                        }),
                        g = Object(c.a)(m, 1)[0];
                    return r.a.createElement(xn, Object.assign({}, g, o));
                }),
                Tn = Object(o.memo)(function (n) {
                    var t = n.appActions,
                        e = n.totalMinutes,
                        a = Object(p.a)(n, ['appActions', 'totalMinutes']);
                    return r.a.createElement(
                        jn,
                        a,
                        On()(e / 15).map(function (n) {
                            return r.a.createElement(Dn, {
                                key: n,
                                appActions: t,
                                quarterInMinutes: n,
                            });
                        })
                    );
                });
            function kn() {
                var n = Object(f.a)([
                    '\n    position: relative;\n    height: ',
                    ';\n',
                ]);
                return (
                    (kn = function () {
                        return n;
                    }),
                    n
                );
            }
            function Rn() {
                var n = Object(f.a)(['']);
                return (
                    (Rn = function () {
                        return n;
                    }),
                    n
                );
            }
            var wn = Object(l.d)(F).attrs({ label: "Today's Plan" })(Rn()),
                An = l.d.div(function (n) {
                    var t = n.isTargetedForDrop,
                        e = n.theme;
                    return '\n        bottom: 0;\n        box-shadow: '.concat(
                        t
                            ? '0 0 0 5px '.concat(
                                  R[e.name].BORDER_HOVER,
                                  ' inset'
                              )
                            : 'initial',
                        ';\n        left: 0;\n        overflow: auto;\n        position: absolute;\n        right: 0;\n        top: 0;\n        user-select: none;\n    '
                    );
                }),
                yn = l.d.div(kn(), w(30)),
                _n = l.d.div(function (n) {
                    var t = n.hideLabel,
                        e = n.isFaded,
                        a = n.theme;
                    return '\n        color: '
                        .concat(
                            t
                                ? 'transparent'
                                : Object(m.d)(e ? 1 : 0, R[a.name].TEXT_FADED),
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
                                R[a.name].BORDER_NEUTRAL
                            ),
                            ";\n            content: '';\n            height: 1px;\n            left: "
                        )
                        .concat(
                            '80px',
                            ';\n            position: absolute;\n            right: 0;\n            top: 50%;\n        }\n    '
                        );
                }),
                Cn = Object(l.d)(G)(function (n) {
                    var t = n.offsetMinutes;
                    return '\n        position: absolute;\n        left: calc('
                        .concat('30px', ' * 3);\n        right: ')
                        .concat('30px', ';\n        top: ')
                        .concat(
                            w(t),
                            ';\n        width: auto;\n        z-index: 2;\n    '
                        );
                }),
                In = l.d.div(function (n) {
                    var t = n.offsetMinutes;
                    return '\n        background-color: red;\n        height: 1px;\n        left: 0;\n        pointer-events: none;\n        position: absolute;\n        right: 0;\n        top: '.concat(
                        w(t),
                        ';\n        z-index: 10;\n    '
                    );
                }),
                Sn = Object(o.memo)(function (n) {
                    var t = n.appActions,
                        e = n.appData,
                        a = n.selectedTaskId,
                        i = n.from,
                        s = n.tasks,
                        l = n.to,
                        u =
                            (n.onClickTask,
                            Object(p.a)(n, [
                                'appActions',
                                'appData',
                                'selectedTaskId',
                                'from',
                                'tasks',
                                'to',
                                'onClickTask',
                            ])),
                        d = b('task-id', function () {}),
                        f = Object(c.a)(d, 1)[0],
                        m = Object(o.useState)(null),
                        g = Object(c.a)(m, 2),
                        h = g[0],
                        O = g[1],
                        v = vn(h),
                        E = Object(c.a)(v, 2),
                        j = E[0],
                        x = E[1],
                        D = vn(i),
                        T = Object(c.a)(D, 2),
                        k = T[0],
                        R = T[1],
                        w = Object(o.useState)(!1),
                        A = Object(c.a)(w, 2),
                        y = A[0],
                        _ = A[1],
                        C = s.filter(function (n) {
                            return n.scheduled;
                        }),
                        I = vn(l),
                        S = Object(c.a)(I, 2),
                        F = S[0],
                        B = S[1],
                        M = F - k,
                        N = 60 * F + B - (60 * k + R),
                        H = Object(o.useRef)(null),
                        L = Object(o.useRef)(null);
                    return (
                        Object(o.useEffect)(function () {
                            var n = function () {
                                var n = new Date();
                                O(
                                    ''
                                        .concat(n.getHours(), ':')
                                        .concat(n.getMinutes())
                                ),
                                    _(!0);
                            };
                            n();
                            var t = setInterval(n, 1e3);
                            return function () {
                                return clearInterval(t);
                            };
                        }, []),
                        Object(o.useEffect)(
                            function () {
                                y &&
                                    H.current &&
                                    L.current &&
                                    L.current.scrollTo(
                                        0,
                                        H.current.offsetTop - 150
                                    );
                            },
                            [y, H, L]
                        ),
                        r.a.createElement(
                            wn,
                            u,
                            r.a.createElement(
                                An,
                                Object.assign({ ref: L }, f),
                                C.map(function (n) {
                                    var o = vn(n.scheduled_time),
                                        i = Object(c.a)(o, 2),
                                        s = 60 * i[0] + i[1] - (60 * k + R);
                                    return r.a.createElement(Cn, {
                                        key: n.id,
                                        appActions: t,
                                        appData: e,
                                        isActive: a === n.id,
                                        offsetMinutes: s,
                                        task: n,
                                    });
                                }),
                                r.a.createElement(In, {
                                    ref: H,
                                    offsetMinutes: 60 * j + x - (60 * k + R),
                                }),
                                r.a.createElement(Tn, {
                                    appActions: t,
                                    totalMinutes: N,
                                }),
                                On()(M).map(function (n) {
                                    return r.a.createElement(
                                        o.Fragment,
                                        { key: n },
                                        r.a.createElement(
                                            yn,
                                            null,
                                            r.a.createElement(
                                                _n,
                                                { hideLabel: 0 === n },
                                                (k + n) % 12 || 12,
                                                ':00'
                                            )
                                        ),
                                        r.a.createElement(
                                            yn,
                                            null,
                                            r.a.createElement(
                                                _n,
                                                { isFaded: !0 },
                                                (k + n) % 12 || 12,
                                                ':30'
                                            )
                                        )
                                    );
                                })
                            )
                        )
                    );
                }),
                Fn = Object(l.b)(function (n) {
                    var t = n.theme;
                    return '\n        * {\n            background: unset;\n            border: unset;\n            box-sizing: border-box;\n            color: unset;\n            font: unset;\n            font-size: inherit;\n            line-height: 1.4em;\n            list-style-type: none;\n            margin: 0;\n            outline: unset;\n            padding: 0;\n        }\n        :root {\n            background: '
                        .concat(R[t.name].BACKGROUND, ';\n            color: ')
                        .concat(
                            R[t.name].TEXT,
                            ";\n            font-family: 'Operator Mono', monospace;\n            font-size: 15px;\n            font-weight: 300;\n            height: 100%;\n            overflow: hidden;\n        }\n        strong {\n            font-weight: 900;\n        }\n        em {\n            font-style: italic;\n        }\n        \n        .markdown {\n            * + * {\n                margin-top: calc("
                        )
                        .concat(
                            '30px',
                            ' * 0.5);\n            }\n            \n            h1 {\n                color: '
                        )
                        .concat(
                            R[t.name].TEXT_FADED,
                            ';\n                font-size: 1.4rem;\n                font-weight: 500;\n                border-bottom: 2px dotted '
                        )
                        .concat(
                            R[t.name].TEXT_FADED,
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
                            R[t.name].TEXT_FADED,
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
                            R[t.name].TEXT_FADED,
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
            function Mn() {
                var n = Bn('lists', O),
                    t = Object(c.a)(n, 2),
                    e = t[0],
                    i = (t[1], Bn('tasks', v)),
                    s = Object(c.a)(i, 2),
                    u = s[0],
                    p = s[1],
                    f = Bn('theme-name', 'DARK'),
                    b = Object(c.a)(f, 2),
                    m = b[0],
                    h = b[1],
                    x = Bn('selected-list-id', 1),
                    T = Object(c.a)(x, 2),
                    k = T[0],
                    R = (T[1], Bn('selected-task-id', null)),
                    w = Object(c.a)(R, 2),
                    A = w[0],
                    y = w[1],
                    C = Object(o.useState)(!1),
                    I = Object(c.a)(C, 2),
                    S = I[0],
                    F = I[1],
                    B = Object(o.useState)(!1),
                    M = Object(c.a)(B, 2),
                    N = M[0],
                    H = M[1],
                    L =
                        (Object(o.useMemo)(
                            function () {
                                return e.find(function (n) {
                                    return n.id === k;
                                });
                            },
                            [e, k]
                        ),
                        Object(o.useMemo)(
                            function () {
                                return u.find(function (n) {
                                    return n.id === A;
                                });
                            },
                            [u, A]
                        )),
                    X = Object(o.useMemo)(
                        function () {
                            return u.filter(function (n) {
                                return !n.isComplete;
                            });
                        },
                        [u]
                    ),
                    U = X.length,
                    Y = function () {
                        return H(!1);
                    };
                Object(o.useEffect)(
                    function () {
                        Y();
                    },
                    [u]
                );
                var G = Object(o.useCallback)(
                        function (n, t) {
                            p(function (e) {
                                return e.map(function (e) {
                                    return e.id === n
                                        ? Object(a.a)(Object(a.a)({}, e), t)
                                        : e;
                                });
                            });
                        },
                        [p]
                    ),
                    P = Object(o.useCallback)(
                        function () {
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
                                            list_id: k,
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
                        [k, y, p]
                    ),
                    z = y,
                    K = {
                        getTaskById: function (n) {
                            return u.find(function (t) {
                                return t.id === n;
                            });
                        },
                        onChangeTaskPosition: Object(o.useCallback)(
                            function (n, t) {
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
                            [p]
                        ),
                        onChangeTheme: h,
                        onCreateTask: P,
                        onSelectTask: z,
                        onUpdateTask: G,
                    },
                    V = {
                        isDraggingTask: N,
                        selectedTaskId: A,
                        tasks: u,
                        theme: m,
                    };
                return r.a.createElement(
                    l.a,
                    { theme: { name: m } },
                    r.a.createElement(Fn, null),
                    r.a.createElement($, { appActions: K, appData: V }),
                    r.a.createElement(
                        _,
                        {
                            align: 'stretch',
                            direction: 'row-reverse',
                            onDragOver: function () {
                                return H(!0);
                            },
                            onDragEnd: Y,
                        },
                        r.a.createElement(Sn, {
                            appActions: K,
                            appData: V,
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
                            appActions: K,
                            appData: V,
                            task: L,
                            isCreatingTask: S,
                            style: { width: '40vw', opacity: U ? 1 : 0.25 },
                        }),
                        r.a.createElement(q, {
                            appActions: K,
                            appData: V,
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
        62: function (n, t, e) {
            n.exports = e(171);
        },
    },
    [[62, 1, 2]],
]);
//# sourceMappingURL=main.b65ee8b7.chunk.js.map
