use gpui::{div, prelude::*, px, rgb, size, App, Application, Bounds, Context, Div, SharedString, Window, WindowBounds, WindowOptions};

#[derive(Clone)]
struct DemoRow {
    filename: SharedString,
    path: SharedString,
    size: SharedString,
    modified: SharedString,
    created: SharedString,
}

impl DemoRow {
    fn new(filename: &str, path: &str, size: &str, modified: &str, created: &str) -> Self {
        Self {
            filename: SharedString::from(filename.to_owned()),
            path: SharedString::from(path.to_owned()),
            size: SharedString::from(size.to_owned()),
            modified: SharedString::from(modified.to_owned()),
            created: SharedString::from(created.to_owned()),
        }
    }
}

struct CardinalDemo {
    search_query: SharedString,
    case_sensitive: bool,
    use_regex: bool,
    is_initialized: bool,
    scanned_files: u64,
    processed_events: u64,
    search_duration_ms: f32,
    results: Vec<DemoRow>,
}

impl CardinalDemo {
    const PANEL_WIDTH: f32 = 960.0;
    const TABLE_ROW_HEIGHT: f32 = 40.0;
    const FILENAME_COL_WIDTH: f32 = 240.0;
    const SIZE_COL_WIDTH: f32 = 96.0;
    const DATE_COL_WIDTH: f32 = 140.0;

    const PAGE_BG: u32 = 0xf1f3f5;
    const PANEL_BG: u32 = 0xffffff;
    const HEADER_BG: u32 = 0xf8f9fa;
    const ROW_EVEN_BG: u32 = 0xffffff;
    const ROW_ODD_BG: u32 = 0xf7f8fa;
    const BORDER_COLOR: u32 = 0xdee2e6;
    const TEXT_PRIMARY: u32 = 0x212529;
    const TEXT_SECONDARY: u32 = 0x495057;
    const TEXT_MUTED: u32 = 0x6c757d;
    const TEXT_PATH: u32 = 0x343a40;
    const ACCENT_COLOR: u32 = 0x0d6efd;

    fn new() -> Self {
        let results = vec![
            DemoRow::new(
                "App.jsx",
                "cardinal/src/App.jsx",
                "5.4 KB",
                "Oct 18, 2025",
                "Jan 01, 2024",
            ),
            DemoRow::new(
                "index.js",
                "cardinal/src/index.js",
                "2.1 KB",
                "Sep 05, 2024",
                "Jan 02, 2024",
            ),
            DemoRow::new(
                "VirtualList.jsx",
                "cardinal/src/components/VirtualList.jsx",
                "8.9 KB",
                "Oct 17, 2025",
                "Apr 02, 2024",
            ),
            DemoRow::new(
                "useDataLoader.js",
                "cardinal/src/hooks/useDataLoader.js",
                "3.1 KB",
                "Oct 15, 2025",
                "May 11, 2024",
            ),
            DemoRow::new(
                "format.js",
                "cardinal/src/utils/format.js",
                "1.8 KB",
                "Oct 10, 2025",
                "Feb 08, 2024",
            ),
            DemoRow::new(
                "ContextMenu.jsx",
                "cardinal/src/components/ContextMenu.jsx",
                "4.6 KB",
                "Oct 12, 2025",
                "Mar 14, 2024",
            ),
            DemoRow::new(
                "useColumnResize.js",
                "cardinal/src/hooks/useColumnResize.js",
                "6.2 KB",
                "Sep 29, 2025",
                "Mar 30, 2024",
            ),
            DemoRow::new(
                "StatusBar.jsx",
                "cardinal/src/components/StatusBar.jsx",
                "2.7 KB",
                "Oct 19, 2025",
                "Mar 01, 2024",
            ),
            DemoRow::new(
                "StateDisplay.jsx",
                "cardinal/src/components/StateDisplay.jsx",
                "3.9 KB",
                "Oct 14, 2025",
                "Feb 21, 2024",
            ),
            DemoRow::new(
                "VirtualList.css",
                "cardinal/src/components/VirtualList.css",
                "1.2 KB",
                "Aug 30, 2025",
                "Apr 05, 2024",
            ),
        ];

        Self {
            search_query: "Search for files and folders...".into(),
            case_sensitive: false,
            use_regex: true,
            is_initialized: true,
            scanned_files: 128_440,
            processed_events: 684_220,
            search_duration_ms: 42.6,
            results,
        }
    }

    fn result_count(&self) -> usize {
        self.results.len()
    }

    fn format_number(value: u64) -> String {
        let digits = value.to_string();
        let mut formatted = String::with_capacity(digits.len() + digits.len() / 3);
        let mut count = 0;

        for ch in digits.chars().rev() {
            if count != 0 && count % 3 == 0 {
                formatted.push(',');
            }
            formatted.push(ch);
            count += 1;
        }

        formatted.chars().rev().collect()
    }

    fn format_results_text(count: usize) -> String {
        let formatted = Self::format_number(count as u64);
        let suffix = if count == 1 { "" } else { "s" };
        format!("{formatted} result{suffix}")
    }

    fn format_duration(ms: f32) -> String {
        format!("{} ms", ms.round() as i32)
    }

    fn search_toggle(label: &str, caption: &str, active: bool) -> Div {
        let (background, border, label_color) = if active {
            (Self::ACCENT_COLOR, Self::ACCENT_COLOR, 0xffffff)
        } else {
            (0xf1f3f5, Self::BORDER_COLOR, Self::TEXT_SECONDARY)
        };

        let mut toggle = div()
            .flex()
            .flex_col()
            .items_center()
            .gap_1()
            .min_w(px(60.0))
            .child(
                div()
                    .flex()
                    .items_center()
                    .justify_center()
                    .px_3()
                    .py_1()
                    .rounded_full()
                    .border_1()
                    .border_color(rgb(border))
                    .bg(rgb(background))
                    .text_color(rgb(label_color))
                    .text_sm()
                    .child(label.to_string()),
            );

        if !caption.is_empty() {
            toggle = toggle.child(
                div()
                    .text_color(rgb(Self::TEXT_MUTED))
                    .text_xs()
                    .child(caption.to_string()),
            );
        }

        toggle
    }

    fn header_cell(label: &str, width: Option<f32>) -> Div {
        let base = div()
            .text_color(rgb(Self::TEXT_MUTED))
            .text_xs()
            .text_left();

        let base = match width {
            Some(value) => base.w(px(value)),
            None => base.flex_1(),
        };

        base.child(label.to_string())
    }

    fn data_cell(content: SharedString, width: Option<f32>, color: u32, truncate: bool) -> Div {
        let mut cell = div()
            .text_color(rgb(color))
            .text_sm()
            .text_left();

        cell = match width {
            Some(value) => cell.w(px(value)),
            None => cell.flex_1(),
        };

        if truncate {
            cell = cell.truncate();
        }

        cell.child(content)
    }

    fn table_row(background: u32, cells: Vec<Div>, with_divider: bool) -> Div {
        let mut row = div()
            .flex()
            .items_center()
            .bg(rgb(background))
            .h(px(Self::TABLE_ROW_HEIGHT))
            .gap_3()
            .px_5()
            .border_color(rgb(Self::BORDER_COLOR));

        if with_divider {
            row = row.border_b_1();
        }

        cells.into_iter().fold(row, |acc, cell| acc.child(cell))
    }

    fn search_section(&self) -> Div {
        let search_mode = if self.use_regex {
            "Regex search"
        } else {
            "Literal search"
        };
        let case_mode = if self.case_sensitive {
            "Case sensitive"
        } else {
            "Case insensitive"
        };
        let readiness = if self.is_initialized {
            "Index ready"
        } else {
            "Initializing index"
        };

        div()
            .flex()
            .flex_col()
            .gap_2()
            .child(
                div()
                    .flex()
                    .items_center()
                    .gap_3()
                    .bg(rgb(Self::HEADER_BG))
                    .border_1()
                    .border_color(rgb(Self::BORDER_COLOR))
                    .rounded_lg()
                    .px_4()
                    .py_3()
                    .child(div().text_color(rgb(Self::TEXT_MUTED)).text_lg().child("🔍".to_string()))
                    .child(
                        div()
                            .flex_1()
                            .text_color(rgb(Self::TEXT_MUTED))
                            .text_sm()
                            .text_left()
                            .child(self.search_query.clone()),
                    )
                    .child(
                        div()
                            .flex()
                            .items_center()
                            .gap_3()
                            .child(Self::search_toggle("Aa", "", self.case_sensitive))
                            .child(Self::search_toggle(".*", "", self.use_regex)),
                    ),
            )
            .child(
                div()
                    .text_color(rgb(Self::TEXT_MUTED))
                    .text_xs()
                    .px_1()
                    .child(format!("{} • {} • {}", search_mode, case_mode, readiness)),
            )
    }

    fn results_section(&self) -> Div {
        let header = Self::table_row(
            Self::HEADER_BG,
            vec![
                Self::header_cell("Filename", Some(Self::FILENAME_COL_WIDTH)),
                Self::header_cell("Path", None),
                Self::header_cell("Size", Some(Self::SIZE_COL_WIDTH)),
                Self::header_cell("Modified", Some(Self::DATE_COL_WIDTH)),
                Self::header_cell("Created", Some(Self::DATE_COL_WIDTH)),
            ],
            true,
        );

        let body = self
            .results
            .iter()
            .enumerate()
            .fold(div().flex().flex_col(), |acc, (index, row)| {
                let background = if index % 2 == 0 {
                    Self::ROW_EVEN_BG
                } else {
                    Self::ROW_ODD_BG
                };
                let is_last = index + 1 == self.results.len();

                acc.child(Self::table_row(
                    background,
                    vec![
                        Self::data_cell(
                            row.filename.clone(),
                            Some(Self::FILENAME_COL_WIDTH),
                            Self::TEXT_PRIMARY,
                            true,
                        ),
                        Self::data_cell(row.path.clone(), None, Self::TEXT_PATH, true),
                        Self::data_cell(
                            row.size.clone(),
                            Some(Self::SIZE_COL_WIDTH),
                            Self::TEXT_SECONDARY,
                            false,
                        ),
                        Self::data_cell(
                            row.modified.clone(),
                            Some(Self::DATE_COL_WIDTH),
                            Self::TEXT_SECONDARY,
                            false,
                        ),
                        Self::data_cell(
                            row.created.clone(),
                            Some(Self::DATE_COL_WIDTH),
                            Self::TEXT_SECONDARY,
                            false,
                        ),
                    ],
                    !is_last,
                ))
            });

        let summary = {
            let results_text = Self::format_results_text(self.result_count());
            let duration_text = Self::format_duration(self.search_duration_ms);

            div()
                .flex()
                .items_center()
                .bg(rgb(Self::HEADER_BG))
                .text_color(rgb(Self::TEXT_MUTED))
                .text_sm()
                .px_5()
                .py_3()
                .border_t_1()
                .border_color(rgb(Self::BORDER_COLOR))
                .child(format!("{} • {}", results_text, duration_text))
        };

        div()
            .flex()
            .flex_col()
            .bg(rgb(Self::PANEL_BG))
            .border_1()
            .border_color(rgb(Self::BORDER_COLOR))
            .rounded_lg()
            .overflow_hidden()
            .child(header)
            .child(body)
            .child(summary)
    }

    fn status_item(label: &str, value: String) -> Div {
        div()
            .flex()
            .items_center()
            .gap_1()
            .text_sm()
            .child(
                div()
                    .text_color(rgb(Self::TEXT_MUTED))
                    .child(format!("{}:", label)),
            )
            .child(div().text_color(rgb(Self::TEXT_SECONDARY)).child(value))
    }

    fn status_section(&self) -> Div {
        let readiness_label = if self.is_initialized {
            "Ready"
        } else {
            "Initializing"
        };
        let readiness_color = if self.is_initialized {
            Self::ACCENT_COLOR
        } else {
            0xffc078
        };

        let search_summary = format!(
            "{} • {}",
            Self::format_results_text(self.result_count()),
            Self::format_duration(self.search_duration_ms)
        );

        div()
            .flex()
            .justify_between()
            .items_center()
            .flex_wrap()
            .gap_3()
            .bg(rgb(Self::PANEL_BG))
            .border_1()
            .border_color(rgb(Self::BORDER_COLOR))
            .rounded_lg()
            .px_4()
            .py_2()
            .child(
                div()
                    .flex()
                    .items_center()
                    .flex_wrap()
                    .gap_4()
                    .child(
                        div()
                            .flex()
                            .items_center()
                            .gap_2()
                            .child(
                                div()
                                    .w(px(10.0))
                                    .h(px(10.0))
                                    .rounded_full()
                                    .bg(rgb(readiness_color)),
                            )
                            .child(
                                div()
                                    .text_color(rgb(Self::TEXT_SECONDARY))
                                    .text_sm()
                                    .child(readiness_label.to_string()),
                            ),
                    )
                    .child(Self::status_item(
                        "Files",
                        Self::format_number(self.scanned_files),
                    ))
                    .child(Self::status_item(
                        "Events",
                        Self::format_number(self.processed_events),
                    )),
            )
            .child(
                div()
                    .flex()
                    .items_center()
                    .gap_2()
                    .text_sm()
                    .child(
                        div()
                            .text_color(rgb(Self::TEXT_MUTED))
                            .child("Search:".to_string()),
                    )
                    .child(
                        div()
                            .text_color(rgb(Self::TEXT_SECONDARY))
                            .child(search_summary),
                    ),
            )
    }
}

impl Render for CardinalDemo {
    fn render(&mut self, _window: &mut Window, _cx: &mut Context<Self>) -> impl IntoElement {
        div()
            .font_family(".SystemUIFont")
            .bg(rgb(Self::PAGE_BG))
            .text_color(rgb(Self::TEXT_PRIMARY))
            .size_full()
            .p_6()
            .child(
                div()
                    .flex()
                    .flex_col()
                    .gap_4()
                    .max_w(px(Self::PANEL_WIDTH))
                    .w_full()
                    .mx_auto()
                    .child(self.search_section())
                    .child(self.results_section())
                    .child(self.status_section()),
            )
    }
}

fn main() {
    Application::new().run(|cx: &mut App| {
        let bounds = Bounds::centered(None, size(px(1280.0), px(900.0)), cx);
        cx.open_window(
            WindowOptions {
                window_bounds: Some(WindowBounds::Windowed(bounds)),
                ..Default::default()
            },
            |_, cx| cx.new(|_| CardinalDemo::new()),
        )
        .unwrap();
    });
}
