use cardinal_sdk::{
    fsevent::{EventStream, FsEvent},
    fsevent_sys::FSEventStreamEventId,
};
use crossbeam::channel::{Receiver, unbounded};

fn main() {
    let path = std::env::args().nth(1).expect("no path provided");
    let event_stream = spawn_event_watcher(path, 0);
    while let Ok(events) = event_stream.recv() {
        for event in events {
            println!("{:?}", event);
        }
    }
}

fn spawn_event_watcher(
    path: String,
    since_event_id: FSEventStreamEventId,
) -> Receiver<Vec<FsEvent>> {
    let (sender, receiver) = unbounded();
    std::thread::spawn(move || {
        EventStream::new(
            &[&path],
            since_event_id,
            0.1,
            Box::new(move |events| {
                sender.send(events).unwrap();
            }),
        )
        .block_on()
        .unwrap();
    });
    receiver
}
