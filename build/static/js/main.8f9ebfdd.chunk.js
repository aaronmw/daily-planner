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
                u = e(1),
                l = e(29),
                d = e.n(l),
                p = e(3),
                f = e(5),
                m = function (n) {
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
                b = e(4),
                g = '\ud83d\udccc',
                h = [15, 30, 45, 60, 90, 120],
                v = [{ id: 1, label: 'Default List' }],
                O = [],
                E = '7:00',
                j = '24:00',
                x = 'transition: all 0.15s ease-in-out',
                k = {
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
                (T.BORDER_HOVER = Object(b.c)(0.5, '#0094FF')),
                (T.BORDER_IDLE = Object(b.c)(0.3, '#0094FF')),
                (T.SHADED = Object(b.a)(0.1, T.BACKGROUND)),
                (T.TEXT = Object(b.c)(0.85, T.PRIMARY)),
                (T.TEXT_FADED = Object(b.c)(0.4, T.TEXT)),
                (T.BORDER_NEUTRAL = Object(b.c)(0.15, T.TEXT));
            var R = { PRIMARY: '#0094FF', BACKGROUND: 'white' };
            (R.HIGH_CONTRAST_BACKGROUND = R.PRIMARY),
                (R.HIGH_CONTRAST_TEXT = R.BACKGROUND),
                (R.BORDER_HOVER = Object(b.b)('#0094FF', 0.5)),
                (R.BORDER_IDLE = Object(b.b)('#0094FF', 0.3)),
                (R.BORDER_NEUTRAL = Object(b.c)(0.75, R.BACKGROUND)),
                (R.SHADED = Object(b.c)(0.95, R.PRIMARY)),
                (R.TEXT = Object(b.c)(0.15, R.PRIMARY)),
                (R.TEXT_FADED = R.BORDER_NEUTRAL);
            var D = { DARK: T, LIGHT: R },
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
                        m = void 0 === f ? 0 : f,
                        b = n.paddingY,
                        g = void 0 === b ? 0 : b,
                        h = n.theme;
                    return '\n        box-shadow: '
                        .concat(
                            e
                                ? '0 0 0 1px '.concat(D[h.name].BORDER_NEUTRAL)
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
                            m
                                ? '\n                    padding-left: calc('
                                      .concat(m, ' * ')
                                      .concat(
                                          '30px',
                                          ');\n                    padding-right: calc('
                                      )
                                      .concat(m, ' * ')
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
                C = Object(u.d)(_).attrs({
                    direction: 'column',
                    isFlexible: !0,
                })(function (n) {
                    n.theme;
                    return '\n        \n    ';
                }),
                I = Object(u.d)(_).attrs({ direction: 'column' })(function (n) {
                    n.theme;
                    return '\n        height: calc(100vh - '.concat(
                        '30px',
                        ');\n        overflow: auto;\n        position: relative;\n        \n        & > * {\n            align-self: stretch;\n        }\n    '
                    );
                }),
                S = Object(u.d)(_).attrs({ justify: 'center', paddingX: 0.5 })(
                    function (n) {
                        var t = n.theme;
                        return '\n        background: '
                            .concat(D[t.name].BACKGROUND, ';\n        color: ')
                            .concat(
                                D[t.name].TEXT_FADED,
                                ';\n        border-bottom: 2px solid '
                            )
                            .concat(
                                D[t.name].BORDER_NEUTRAL,
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
                B = Object(u.d)(_).attrs({
                    as: 'button',
                    justify: 'center',
                    paddingX: 0.5,
                    paddingY: 0.25,
                })(function (n) {
                    var t = n.theme;
                    return '\n        background: '
                        .concat(D[t.name].PRIMARY, ';\n        border-radius: ')
                        .concat('3px', ';\n        color: ')
                        .concat(
                            D[t.name].TEXT,
                            ';\n        cursor: pointer;\n        transform: scale(1);\n        '
                        )
                        .concat(
                            x,
                            ';\n        \n        &:focus,\n        &:hover {\n            box-shadow: 0 0 0 2px '
                        )
                        .concat(
                            D[t.name].PRIMARY,
                            ';\n        }\n        &:active {\n            transform: scale(0.9);\n            filter: hue-rotate(20deg);\n        }\n    '
                        );
                }),
                M = Object(u.d)(B)(function (n) {
                    var t = n.theme;
                    return '\n        background: unset; \n        border-radius: '
                        .concat('3px', ';\n        border: 2px dashed ')
                        .concat(
                            D[t.name].BORDER_IDLE,
                            ';\n        width: 100%;\n        \n        &:focus,\n        &:hover {\n            border-color: '
                        )
                        .concat(D[t.name].BORDER_HOVER, ';\n        }\n    ');
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
                        .concat(D[t.name].BACKGROUND, ';\n        color: ')
                        .concat(
                            D[t.name].TEXT_FADED,
                            ';\n        width: 100%;\n        z-index: 10;\n        \n        &:focus-within,\n        &:hover {\n            color: '
                        )
                        .concat(D[t.name].TEXT, ';\n        }\n    ');
                }),
                X = Object(u.d)(N)(function (n) {
                    var t = n.isSelected;
                    n.theme;
                    return '\n        background: transparent;\n        color: inherit;\n        font-weight: '
                        .concat(t ? 900 : 100, ';\n        opacity: ')
                        .concat(t ? 1 : 0, ';\n        width: auto;\n        ')
                        .concat(x, ';\n        \n        ')
                        .concat(L, ':focus-within > &,\n        ')
                        .concat(
                            L,
                            ':hover > & {\n            opacity: 1;\n        }\n    '
                        );
                }),
                H = function (n) {
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
                                X,
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
                U = Object(u.d)(_).attrs({
                    align: 'flex-start',
                    justify: 'space-between',
                    spacing: 0.5,
                    paddingX: 0.5,
                })(function (n) {
                    var t = n.duration,
                        e = n.isActive,
                        a = n.isDragging,
                        c = n.theme;
                    return '\n        background-color: '
                        .concat(
                            D[c.name].BACKGROUND,
                            ';\n        border-radius: '
                        )
                        .concat('3px', ';\n        box-shadow: 0 0 0 2px ')
                        .concat(
                            D[c.name][e ? 'PRIMARY' : 'BORDER_IDLE'],
                            ';\n        cursor: pointer;\n        height: '
                        )
                        .concat(w(t), ';\n        opacity: ')
                        .concat(
                            a ? 0 : 1,
                            ';\n        overflow: hidden;\n        padding-left: calc('
                        )
                        .concat('30px', ' * 0.5 + ')
                        .concat(
                            '5px',
                            ');\n        position: relative;\n        transition-property: opacity, top;\n        width: 100%;\n        z-index: '
                        )
                        .concat(e ? 10 : 'initial', ';\n        ')
                        .concat(
                            x,
                            ';\n        transition-property:\n            background-color,\n            box-shadow,\n            height,\n            min-height,\n            opacity,\n            width;\n\n        &:before {\n            background-color: '
                        )
                        .concat(
                            D[c.name].PRIMARY,
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
                            D[c.name].BORDER_HOVER,
                            ';\n        }\n        \n        &:focus {\n            box-shadow: 0 0 0 2px '
                        )
                        .concat(
                            D[c.name].PRIMARY,
                            ';\n        }\n        \n        &:active {\n            box-shadow: 0 0 0 2px '
                        )
                        .concat(
                            D[c.name].PRIMARY,
                            ' inset;\n        }\n        \n        '
                        )
                        .concat(Y, ' {\n            color: ')
                        .concat(
                            D[c.name][e ? 'TEXT' : 'TEXT_FADED'],
                            ';\n            min-height: '
                        )
                        .concat(w(Math.min(30, t)), ';\n        }\n\n        ')
                        .concat(P, ' {\n            height: ')
                        .concat(w(Math.min(30, t)), ';\n        }\n    ');
                }),
                Y = Object(u.d)(_).attrs({ align: 'center', isFlexible: !0 })(
                    function (n) {
                        var t = n.theme;
                        return '\n        position: relative;\n        width: auto;\n        '
                            .concat(x, ';\n        \n        ')
                            .concat(U, ':hover > & {\n            color: ')
                            .concat(D[t.name].TEXT, ';\n        }\n    ');
                    }
                ),
                P = Object(u.d)(_).attrs({
                    align: 'center',
                    justify: 'center',
                })(function (n) {
                    n.theme;
                    return '\n        width: auto;\n    ';
                }),
                G = Object(o.memo)(function (n) {
                    var t = n.appActions,
                        e = n.isActive,
                        a = n.task,
                        i = Object(p.a)(n, ['appActions', 'isActive', 'task']),
                        s = t.onSelectTask,
                        u = a.icon,
                        l = a.id,
                        d = a.label,
                        f = a.scheduled_minutes,
                        m = (function (n, t) {
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
                        })('task-id', l),
                        b = Object(c.a)(m, 1)[0];
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
                            b,
                            i
                        ),
                        r.a.createElement(Y, null, d),
                        r.a.createElement(P, null, u)
                    );
                });
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
                        e = n.theme;
                    return '\n        background-color: '
                        .concat(
                            D[e.name].SHADED,
                            ';\n        flex-grow: 1;\n        overflow: '
                        )
                        .concat(t ? 'auto' : 'visible', ';\n    ');
                }),
                V = Object(u.d)(y).attrs({ isFlexible: !0 })(function (n) {
                    var t = n.isTargetedForDrop,
                        e = n.theme;
                    return '\n        box-shadow: '.concat(
                        t
                            ? '0 0 0 5px '.concat(
                                  D[e.name].BORDER_HOVER,
                                  ' inset'
                              )
                            : 'initial',
                        ';\n        position: relative;\n    '
                    );
                }),
                q = Object(u.d)(y)(z(), '30px'),
                J = Object(o.memo)(function (n) {
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
                        b = m('task-id', function (n, t) {
                            d(n, { scheduled: !1 });
                        }),
                        g = Object(c.a)(b, 1)[0],
                        h = m('task-id', function (n, t) {
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
                        r.a.createElement(H, {
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
                            V,
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
                                            q,
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
                });
            function W() {
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
                    (W = function () {
                        return n;
                    }),
                    n
                );
            }
            function Q() {
                var n = Object(f.a)([
                    '\n    0% {\n        box-shadow: 0 0 0 0 ',
                    ';\n        transform: scale(1);\n    }\n    100% {\n        box-shadow: 0 0 50px 0 ',
                    ';\n        transform: scale(1.2);\n    }\n',
                ]);
                return (
                    (Q = function () {
                        return n;
                    }),
                    n
                );
            }
            var Z = function (n) {
                    var t = n.theme;
                    return Object(u.e)(
                        Q(),
                        D[t.name].PRIMARY,
                        D[t.name].PRIMARY
                    );
                },
                $ = u.d.div(function (n) {
                    var t = n.isDraggingTask,
                        e = n.isTargetedForDrop,
                        a = n.theme;
                    return Object(u.c)(
                        W(),
                        e ? Z : 'unset',
                        Object(b.d)(e ? 0 : t ? 0.35 : 0.8, D[a.name].PRIMARY),
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
                nn = function (n) {
                    var t = n.appActions,
                        e = n.appData,
                        a = Object(p.a)(n, ['appActions', 'appData']),
                        o = t.onSelectTask,
                        i = t.onUpdateTask,
                        s = e.isDraggingTask,
                        u = m('task-id', function (n) {
                            i(n, { isComplete: !0 }),
                                o(function (t) {
                                    return t === n ? null : t;
                                });
                        }),
                        l = Object(c.a)(u, 1)[0];
                    return r.a.createElement(
                        $,
                        Object.assign({ isDraggingTask: s }, l, a)
                    );
                },
                tn = e(57),
                en = e.n(tn),
                an = e(58),
                cn = e.n(an),
                on = e(59),
                rn = e.n(on),
                sn = ['input', 'textarea'],
                un = function (n) {
                    return (
                        n.tagName &&
                        sn
                            .map(function (n) {
                                return n.toLowerCase();
                            })
                            .includes(n.tagName.toLowerCase())
                    );
                },
                ln = function (n) {
                    var t =
                        arguments.length > 1 && void 0 !== arguments[1]
                            ? arguments[1]
                            : { current: null };
                    Object(o.useEffect)(
                        function () {
                            var e = (function (n, t) {
                                return function (e) {
                                    var a = [];
                                    e.ctrlKey && a.push('control'),
                                        e.shiftKey && a.push('shift'),
                                        e.metaKey && a.push('cmd'),
                                        a.push(e.key);
                                    var c = rn()(a)
                                        .map(function (n) {
                                            return n.toLowerCase();
                                        })
                                        .sort()
                                        .join('+');
                                    cn()(n, function (n, a) {
                                        var o = a
                                            .split('+')
                                            .map(function (n) {
                                                return n.trim().toLowerCase();
                                            })
                                            .sort()
                                            .join('+');
                                        if (c === o) {
                                            var r = t.current,
                                                i = r && un(r),
                                                s = un(document.activeElement);
                                            return (
                                                i && e.stopPropagation(),
                                                !(!i && s) && n(e)
                                            );
                                        }
                                    });
                                };
                            })(n, t);
                            return (
                                document.addEventListener('keydown', e),
                                function () {
                                    return document.removeEventListener(
                                        'keydown',
                                        e
                                    );
                                }
                            );
                        },
                        [n]
                    );
                },
                dn = Object(u.d)(y).attrs({ isFlexible: !0 })(function (n) {
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
                            D[a.name].BORDER_HOVER,
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
                            ';\n        }\n        \n        &:focus,\n        &:hover {\n            &:before {\n                opacity: 1;\n            }\n        }\n    '
                        );
                }),
                pn = Object(o.memo)(function (n) {
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
                        m = void 0 === f ? '' : f,
                        b = n.wrapperStyles,
                        g = void 0 === b ? {} : b,
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
                        k = j[1],
                        T = Object(o.useState)(m),
                        R = Object(c.a)(T, 2),
                        D = R[0],
                        w = R[1],
                        A = Object(o.useState)(null),
                        _ = Object(c.a)(A, 2),
                        C = _[0],
                        I = _[1],
                        S = Object(o.useRef)(null),
                        F = Object(o.useRef)(null),
                        B = '' === D.trim(),
                        M = !e;
                    Object(o.useEffect)(
                        function () {
                            !0 === i && N();
                        },
                        [i]
                    ),
                        Object(o.useEffect)(
                            function () {
                                w(m);
                            },
                            [m]
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
                            [D, x, F]
                        );
                    var N = function () {
                            x || (w(m), k(!0));
                        },
                        L = function () {
                            v(D), k(!1);
                        },
                        X = function () {
                            w(m), k(!1);
                        },
                        H = Object(o.useMemo)(
                            function () {
                                return {
                                    'cmd + escape': X,
                                    'shift + escape': X,
                                    'cmd + enter': L,
                                    'shift + enter': L,
                                    escape: L,
                                    enter: function (n) {
                                        if (M)
                                            return L(), n.preventDefault(), !1;
                                    },
                                };
                            },
                            [X, M, L]
                        );
                    return (
                        ln(H, S),
                        r.a.createElement(
                            dn,
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
                                              D,
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
                                              value: D,
                                              onBlur: function () {
                                                  v(D), k(!1);
                                              },
                                              onChange: function (n) {
                                                  w(n.target.value);
                                              },
                                          })
                                      )
                                    : d(B ? u : m)
                            )
                        )
                    );
                });
            function fn() {
                var n = Object(f.a)([
                    '\n    align-self: flex-start;\n    flex-grow: 0;\n    flex-shrink: 0;\n    font-size: 3rem;\n    line-height: 1.4rem;\n    width: 3rem;\n',
                ]);
                return (
                    (fn = function () {
                        return n;
                    }),
                    n
                );
            }
            function mn() {
                var n = Object(f.a)([
                    '\n    flex-grow: 1;\n    flex-shrink: 1;\n    justify-self: stretch;\n',
                ]);
                return (
                    (mn = function () {
                        return n;
                    }),
                    n
                );
            }
            var bn = Object(u.d)(F)(function (n) {
                    var t = n.isLoading,
                        e = n.theme;
                    return '\n        box-shadow: 0 0 0 10px rgba(0, 0, 0, 0.1);\n        border-left: 2px solid '
                        .concat(
                            D[e.name].BORDER_NEUTRAL,
                            ';\n        border-right: 2px solid '
                        )
                        .concat(
                            D[e.name].BORDER_NEUTRAL,
                            ';\n        overflow: unset;\n        z-index: 11;\n        \n        // Blackout curtain\n        &:before {\n            background-color: '
                        )
                        .concat(
                            D[e.name].BACKGROUND,
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
                gn = Object(u.d)(_).attrs({
                    as: 'h1',
                    align: 'center',
                    spacing: 1.5,
                    paddingX: 1,
                    paddingY: 0.75,
                })(function (n) {
                    var t = n.theme;
                    return '\n        background-color: '.concat(
                        D[t.name].SHADED,
                        ';\n        font-size: 1.4rem;\n        font-weight: 900;\n        position: relative;\n    '
                    );
                }),
                hn = Object(u.d)(y)(mn()),
                vn = Object(u.d)(y).attrs({ role: 'img' })(fn()),
                On = function (n) {
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
                        m = f[0],
                        b = f[1],
                        v = e.onUpdateTask,
                        O = u.icon,
                        E = u.id,
                        j = u.label,
                        x = u.notes,
                        T = u.scheduled_minutes,
                        R = !u.id,
                        D = function (n, t) {
                            return v(E, { [n]: t });
                        };
                    return (
                        Object(o.useLayoutEffect)(
                            function () {
                                b(!0);
                                var n = setTimeout(function () {
                                    return b(!1);
                                }, 100);
                                return function () {
                                    return clearTimeout(n);
                                };
                            },
                            [u.id]
                        ),
                        r.a.createElement(
                            bn,
                            Object.assign(
                                {
                                    isLoading: m,
                                    label: 'Selected Task Details',
                                },
                                l
                            ),
                            !R &&
                                !m &&
                                r.a.createElement(
                                    r.a.Fragment,
                                    null,
                                    r.a.createElement(H, {
                                        renderSelectedOption: function (n) {
                                            return ''.concat(n, ' mins');
                                        },
                                        selectedOption: T,
                                        options: h,
                                        onChange: function (n) {
                                            return D('scheduled_minutes', n);
                                        },
                                    }),
                                    r.a.createElement(
                                        gn,
                                        null,
                                        r.a.createElement(
                                            hn,
                                            null,
                                            r.a.createElement(pn, {
                                                isRemotelyActivated: i,
                                                placeholder: k.empty_label,
                                                value: j,
                                                onSave: function (n) {
                                                    return D('label', n);
                                                },
                                            })
                                        ),
                                        r.a.createElement(
                                            vn,
                                            null,
                                            r.a.createElement(pn, {
                                                placeholder: g,
                                                value: O,
                                                onSave: function (n) {
                                                    return D('icon', n);
                                                },
                                            })
                                        )
                                    ),
                                    r.a.createElement(pn, {
                                        isFlexible: !0,
                                        isMultiLine: !0,
                                        margin: 1,
                                        placeholder: k.empty_notes,
                                        render: function (n) {
                                            return r.a.createElement('div', {
                                                className: 'markdown',
                                                dangerouslySetInnerHTML: {
                                                    __html: en()(n),
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
                                            return D('notes', n);
                                        },
                                    })
                                )
                        )
                    );
                },
                En = e(20),
                jn = e.n(En),
                xn = function (n) {
                    return n
                        ? n.split(':').map(function (n) {
                              return A(n);
                          })
                        : [0, 0];
                };
            function kn() {
                var n = Object(f.a)([
                    '\n    bottom: 0;\n    height: 100%;\n    left: 0;\n    position: absolute;\n    right: 0;\n    top: 0;\n    width: 100%;\n',
                ]);
                return (
                    (kn = function () {
                        return n;
                    }),
                    n
                );
            }
            var Tn = u.d.div(kn()),
                Rn = u.d.div(function (n) {
                    var t = n.isTargetedForDrop,
                        e = n.theme;
                    return '\n        position: relative;\n        width: 100%;\n        height: '
                        .concat(
                            w(15),
                            ';\n        z-index: 1;\n        border-top: '
                        )
                        .concat(
                            t ? '4px dotted '.concat(D[e.name].PRIMARY) : '',
                            ';\n    '
                        );
                }),
                Dn = Object(o.memo)(function (n) {
                    var t,
                        e = n.appActions,
                        a = n.quarterInMinutes,
                        o = Object(p.a)(n, ['appActions', 'quarterInMinutes']),
                        i = e.onUpdateTask,
                        s = xn(E),
                        u = Object(c.a)(s, 2),
                        l = u[0],
                        d = u[1],
                        f =
                            ((t = 60 * l + d + 15 * a),
                            ''.concat(Math.floor(t / 60), ':').concat(t % 60)),
                        b = m('task-id', function (n) {
                            return i(n, { scheduled: !0, scheduled_time: f });
                        }),
                        g = Object(c.a)(b, 1)[0];
                    return r.a.createElement(Rn, Object.assign({}, g, o));
                }),
                wn = Object(o.memo)(function (n) {
                    var t = n.appActions,
                        e = n.totalMinutes,
                        a = Object(p.a)(n, ['appActions', 'totalMinutes']);
                    return r.a.createElement(
                        Tn,
                        a,
                        jn()(e / 15).map(function (n) {
                            return r.a.createElement(Dn, {
                                key: n,
                                appActions: t,
                                quarterInMinutes: n,
                            });
                        })
                    );
                });
            function An() {
                var n = Object(f.a)([
                    '\n    position: relative;\n    height: ',
                    ';\n',
                ]);
                return (
                    (An = function () {
                        return n;
                    }),
                    n
                );
            }
            function yn() {
                var n = Object(f.a)(['']);
                return (
                    (yn = function () {
                        return n;
                    }),
                    n
                );
            }
            var _n = Object(u.d)(F).attrs({ label: "Today's Plan" })(yn()),
                Cn = u.d.div(function (n) {
                    var t = n.isTargetedForDrop,
                        e = n.theme;
                    return '\n        bottom: 0;\n        box-shadow: '.concat(
                        t
                            ? '0 0 0 5px '.concat(
                                  D[e.name].BORDER_HOVER,
                                  ' inset'
                              )
                            : 'initial',
                        ';\n        left: 0;\n        overflow: auto;\n        position: absolute;\n        right: 0;\n        top: 0;\n        user-select: none;\n    '
                    );
                }),
                In = u.d.div(An(), w(30)),
                Sn = u.d.div(function (n) {
                    var t = n.hideLabel,
                        e = n.isFaded,
                        a = n.theme;
                    return '\n        color: '
                        .concat(
                            t
                                ? 'transparent'
                                : Object(b.d)(e ? 1 : 0, D[a.name].TEXT_FADED),
                            ';\n        padding-right: calc(100% - '
                        )
                        .concat('80px', ' + (')
                        .concat(
                            '30px',
                            ' * 0.5));\n        position: absolute;\n        text-align: right;\n        top: 0;\n        transform: translateY(-50%);\n        width: 100%;\n\n        &:before {\n            background-color: '
                        )
                        .concat(
                            Object(b.d)(
                                e ? 0.8 : 0.5,
                                D[a.name].BORDER_NEUTRAL
                            ),
                            ";\n            content: '';\n            height: 1px;\n            left: "
                        )
                        .concat(
                            '80px',
                            ';\n            position: absolute;\n            right: 0;\n            top: 50%;\n        }\n    '
                        );
                }),
                Fn = Object(u.d)(G)(function (n) {
                    var t = n.isAnotherTaskBeingDragged,
                        e = n.offsetMinutes;
                    return '\n        left: calc('
                        .concat('30px', ' * 3);\n        pointer-events: ')
                        .concat(
                            t ? 'none' : 'all',
                            ';\n        position: absolute;\n        right: '
                        )
                        .concat('30px', ';\n        top: ')
                        .concat(
                            w(e),
                            ';\n        width: auto;\n        z-index: 2;\n    '
                        );
                }),
                Bn = u.d.div(function (n) {
                    var t = n.offsetMinutes;
                    return '\n        background-color: red;\n        height: 1px;\n        left: 0;\n        pointer-events: none;\n        position: absolute;\n        right: 0;\n        top: '.concat(
                        w(t),
                        ';\n        z-index: 10;\n    '
                    );
                }),
                Mn = Object(o.memo)(function (n) {
                    var t = n.appActions,
                        e = n.appData,
                        a = n.selectedTaskId,
                        i = n.from,
                        s = n.tasks,
                        u = n.to,
                        l =
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
                        d = m('task-id', function () {}),
                        f = Object(c.a)(d, 1)[0],
                        b = Object(o.useState)(null),
                        g = Object(c.a)(b, 2),
                        h = g[0],
                        v = g[1],
                        O = xn(h),
                        E = Object(c.a)(O, 2),
                        j = E[0],
                        x = E[1],
                        k = xn(i),
                        T = Object(c.a)(k, 2),
                        R = T[0],
                        D = T[1],
                        w = e.isDraggingTask,
                        A = Object(o.useState)(!1),
                        y = Object(c.a)(A, 2),
                        _ = y[0],
                        C = y[1],
                        I = s.filter(function (n) {
                            return n.scheduled;
                        }),
                        S = xn(u),
                        F = Object(c.a)(S, 2),
                        B = F[0],
                        M = F[1],
                        N = B - R,
                        L = 60 * B + M - (60 * R + D),
                        X = Object(o.useRef)(null),
                        H = Object(o.useRef)(null);
                    return (
                        Object(o.useEffect)(function () {
                            var n = function () {
                                var n = new Date();
                                v(
                                    ''
                                        .concat(n.getHours(), ':')
                                        .concat(n.getMinutes())
                                ),
                                    C(!0);
                            };
                            n();
                            var t = setInterval(n, 1e3);
                            return function () {
                                return clearInterval(t);
                            };
                        }, []),
                        Object(o.useEffect)(
                            function () {
                                _ &&
                                    X.current &&
                                    H.current &&
                                    H.current.scrollTo(
                                        0,
                                        X.current.offsetTop - 150
                                    );
                            },
                            [_, X, H]
                        ),
                        r.a.createElement(
                            _n,
                            l,
                            r.a.createElement(
                                Cn,
                                Object.assign({ ref: H }, f),
                                I.map(function (n) {
                                    var e = xn(n.scheduled_time),
                                        o = Object(c.a)(e, 2),
                                        i = 60 * o[0] + o[1] - (60 * R + D);
                                    return r.a.createElement(Fn, {
                                        key: n.id,
                                        appActions: t,
                                        isAnotherTaskBeingDragged: w,
                                        isActive: a === n.id,
                                        offsetMinutes: i,
                                        task: n,
                                    });
                                }),
                                r.a.createElement(Bn, {
                                    ref: X,
                                    offsetMinutes: 60 * j + x - (60 * R + D),
                                }),
                                r.a.createElement(wn, {
                                    appActions: t,
                                    totalMinutes: L,
                                }),
                                jn()(N).map(function (n) {
                                    return r.a.createElement(
                                        o.Fragment,
                                        { key: n },
                                        r.a.createElement(
                                            In,
                                            null,
                                            r.a.createElement(
                                                Sn,
                                                { hideLabel: 0 === n },
                                                (R + n) % 12 || 12,
                                                ':00'
                                            )
                                        ),
                                        r.a.createElement(
                                            In,
                                            null,
                                            r.a.createElement(
                                                Sn,
                                                { isFaded: !0 },
                                                (R + n) % 12 || 12,
                                                ':30'
                                            )
                                        )
                                    );
                                })
                            )
                        )
                    );
                }),
                Nn = Object(u.b)(function (n) {
                    var t = n.theme;
                    return '\n        * {\n            background: unset;\n            border: unset;\n            box-sizing: border-box;\n            color: unset;\n            font: unset;\n            font-size: inherit;\n            line-height: 1.4em;\n            list-style-type: none;\n            margin: 0;\n            outline: unset;\n            padding: 0;\n        }\n        :root {\n            background: '
                        .concat(D[t.name].BACKGROUND, ';\n            color: ')
                        .concat(
                            D[t.name].TEXT,
                            ";\n            font-family: 'Operator Mono', monospace;\n            font-size: 15px;\n            font-weight: 300;\n            height: 100%;\n            overflow: hidden;\n        }\n        strong {\n            font-weight: 900;\n        }\n        em {\n            font-style: italic;\n        }\n        \n        .markdown {\n            * + * {\n                margin-top: calc("
                        )
                        .concat(
                            '30px',
                            ' * 0.5);\n            }\n            \n            h1 {\n                color: '
                        )
                        .concat(
                            D[t.name].TEXT_FADED,
                            ';\n                font-size: 1.4rem;\n                font-weight: 500;\n                border-bottom: 2px dotted '
                        )
                        .concat(
                            D[t.name].TEXT_FADED,
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
                            D[t.name].TEXT_FADED,
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
                            D[t.name].TEXT_FADED,
                            ';\n                    border-radius: 100px;\n                    width: '
                        )
                        .concat('10px', ';\n                    height: ')
                        .concat(
                            '10px',
                            ';\n                }\n            }\n        }\n    '
                        );
                }),
                Ln = function (n, t) {
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
            function Xn() {
                var n = Ln('lists', v),
                    t = Object(c.a)(n, 2),
                    e = t[0],
                    i = (t[1], Ln('tasks', O)),
                    s = Object(c.a)(i, 2),
                    l = s[0],
                    p = s[1],
                    f = Ln('theme-name', 'DARK'),
                    m = Object(c.a)(f, 2),
                    b = m[0],
                    h = m[1],
                    x = Ln('selected-list-id', 1),
                    T = Object(c.a)(x, 2),
                    R = T[0],
                    D = (T[1], Ln('selected-task-id', null)),
                    w = Object(c.a)(D, 2),
                    A = w[0],
                    y = w[1],
                    C = Object(o.useState)(!1),
                    I = Object(c.a)(C, 2),
                    S = I[0],
                    F = I[1],
                    B = Object(o.useState)(!1),
                    M = Object(c.a)(B, 2),
                    N = M[0],
                    L = M[1],
                    X =
                        (Object(o.useMemo)(
                            function () {
                                return e.find(function (n) {
                                    return n.id === R;
                                });
                            },
                            [e, R]
                        ),
                        Object(o.useMemo)(
                            function () {
                                return l.find(function (n) {
                                    return n.id === A;
                                });
                            },
                            [l, A]
                        )),
                    H = Object(o.useMemo)(
                        function () {
                            return l.filter(function (n) {
                                return !n.isComplete;
                            });
                        },
                        [l]
                    ),
                    U = H.length,
                    Y = function () {
                        return L(!1);
                    };
                Object(o.useEffect)(
                    function () {
                        Y();
                    },
                    [l]
                );
                var P = Object(o.useCallback)(
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
                    G = Object(o.useCallback)(
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
                                            list_id: R,
                                            isComplete: !1,
                                            label: ''
                                                .concat(
                                                    d()(
                                                        k.motivational_descriptors
                                                    ),
                                                    ' '
                                                )
                                                .concat(k.new_task_label),
                                            notes: k.new_task_notes,
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
                        [R, y, p]
                    ),
                    z = y,
                    K = Object(o.useCallback)(
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
                    V = Object(o.useMemo)(
                        function () {
                            return {
                                'cmd + arrowRight': function (n) {
                                    n.preventDefault(), P(A, { scheduled: !0 });
                                },
                                'cmd + arrowLeft': function (n) {
                                    n.preventDefault(), P(A, { scheduled: !1 });
                                },
                            };
                        },
                        [A]
                    );
                ln(V);
                var q = {
                        getTaskById: function (n) {
                            return l.find(function (t) {
                                return t.id === n;
                            });
                        },
                        onChangeTaskPosition: K,
                        onChangeTheme: h,
                        onCreateTask: G,
                        onSelectTask: z,
                        onUpdateTask: P,
                    },
                    W = {
                        isDraggingTask: N,
                        selectedTaskId: A,
                        tasks: l,
                        theme: b,
                    };
                return r.a.createElement(
                    u.a,
                    { theme: { name: b } },
                    r.a.createElement(Nn, null),
                    r.a.createElement(nn, { appActions: q, appData: W }),
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
                        r.a.createElement(Mn, {
                            appActions: q,
                            appData: W,
                            selectedTaskId: A,
                            from: E,
                            style: {
                                opacity: U ? 1 : 0.25,
                                width: '30vw',
                                pointerEvents: U ? 'all' : 'none',
                            },
                            tasks: H,
                            to: j,
                        }),
                        r.a.createElement(On, {
                            appActions: q,
                            appData: W,
                            task: X,
                            isCreatingTask: S,
                            style: { width: '40vw', opacity: U ? 1 : 0.25 },
                        }),
                        r.a.createElement(J, {
                            appActions: q,
                            appData: W,
                            selectedTaskId: A,
                            style: { width: '30vw' },
                            tasks: H,
                        })
                    )
                );
            }
            var Hn = document.getElementById('root');
            s.a.render(r.a.createElement(Xn, null), Hn);
        },
        62: function (n, t, e) {
            n.exports = e(171);
        },
    },
    [[62, 1, 2]],
]);
//# sourceMappingURL=main.8f9ebfdd.chunk.js.map
