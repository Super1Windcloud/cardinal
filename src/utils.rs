pub fn current_timestamp() -> i64 {
    time::OffsetDateTime::now_utc().unix_timestamp()
}
