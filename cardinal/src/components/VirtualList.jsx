// React & libs
import React, {
	useRef,
	useState,
	useCallback,
	useLayoutEffect,
	useEffect,
	forwardRef,
	useImperativeHandle,
	useMemo
} from 'react';
import { invoke } from '@tauri-apps/api/core';
import Scrollbar from './Scrollbar';

/**
 * 虚拟滚动列表组件（含行数据按需加载缓存）
 */
export const VirtualList = forwardRef(function VirtualList({
	results = null,
	rowHeight = 24,
	overscan = 5,
	renderRow,
	onScrollSync,
	className = ''
}, ref) {
	// ----- refs -----
	const containerRef = useRef(null);
	const viewportRef = useRef(null);
	const lastScrollLeftRef = useRef(0);
	const loadingRef = useRef(new Set());

	// ----- state -----
	const [cache, setCache] = useState(() => new Map());
	const [scrollTop, setScrollTop] = useState(0);
	const [viewportHeight, setViewportHeight] = useState(0);
	const [range, setRange] = useState({ start: 0, end: -1 });

	// ----- derived -----
	// 行数直接来自 results（不再支持显式 rowCount）
	const rowCount = results?.length ?? 0;
	// 计算总虚拟高度和滚动范围
	const { totalHeight, maxScrollTop } = useMemo(() => ({
		totalHeight: rowCount * rowHeight,
		maxScrollTop: Math.max(0, rowCount * rowHeight - viewportHeight)
	}), [rowCount, rowHeight, viewportHeight]);

	// ----- callbacks: pure calculations first -----
	// 计算可见范围
	const computeRange = useCallback((currentScrollTop, vh) => {
		if (!rowCount || !vh) return { start: 0, end: -1 };
		const startIndex = Math.floor(currentScrollTop / rowHeight);
		const endIndex = startIndex + Math.ceil(vh / rowHeight) - 1;
		return {
			start: Math.max(0, startIndex - overscan),
			end: Math.min(rowCount - 1, endIndex + overscan)
		};
	}, [rowCount, rowHeight, overscan]);

	// 统一的 range 更新封装
	const setRangeIfChanged = useCallback((nextRange) => {
		setRange(prev => (prev.start !== nextRange.start || prev.end !== nextRange.end) ? nextRange : prev);
	}, []);

	// 更新滚动位置和范围
	const updateScrollAndRange = useCallback((nextScrollTop) => {
		const clamped = Math.max(0, Math.min(nextScrollTop, maxScrollTop));
		setScrollTop(clamped);
		setRangeIfChanged(computeRange(clamped, viewportHeight));
	}, [maxScrollTop, computeRange, viewportHeight, setRangeIfChanged]);

	// ----- data loading -----
	// 内置行数据加载
	const ensureRangeLoaded = useCallback(async (start, end) => {
		if (!results || start < 0 || end < start || rowCount === 0) return;
		const needLoading = [];
		for (let i = start; i <= end; i++) {
			if (!cache.has(i) && !loadingRef.current.has(i)) {
				needLoading.push(i);
				loadingRef.current.add(i);
			}
		}
		if (needLoading.length === 0) return;
		try {
			const slice = needLoading.map(i => results[i]);
			const fetched = await invoke('get_nodes_info', { results: slice });
			setCache(prev => {
				const newCache = new Map(prev);
				needLoading.forEach((originalIndex, idx) => {
					newCache.set(originalIndex, fetched[idx]);
					loadingRef.current.delete(originalIndex);
				});
				return newCache;
			});
		} catch (err) {
			needLoading.forEach(i => loadingRef.current.delete(i));
			console.error('Failed loading rows', err);
		}
	}, [results, rowCount, cache]);

	// ----- event handlers -----
	// 垂直滚动（阻止默认以获得一致行为）
	const handleWheel = useCallback((e) => {
		e.preventDefault();
		updateScrollAndRange(scrollTop + e.deltaY);
	}, [scrollTop, updateScrollAndRange]);

	// 水平滚动同步
	const handleHorizontalScroll = useCallback((e) => {
		const scrollLeft = e.target.scrollLeft;
		if (onScrollSync && scrollLeft !== lastScrollLeftRef.current) {
			lastScrollLeftRef.current = scrollLeft;
			onScrollSync(scrollLeft);
		}
	}, [onScrollSync]);

	// ----- effects -----
	// 结果集变化时重置缓存
	useEffect(() => { // results change -> reset cache
		setCache(new Map());
		loadingRef.current.clear();
	}, [results]);

	// range 变化时自动加载
	useEffect(() => { // auto load
		if (range.end >= range.start) ensureRangeLoaded(range.start, range.end);
	}, [range, ensureRangeLoaded]);

	// 监听容器尺寸变化
	useLayoutEffect(() => { // observe container height
		const container = containerRef.current;
		if (!container) return;
		const updateViewport = () => setViewportHeight(container.clientHeight);
		const resizeObserver = new ResizeObserver(updateViewport);
		resizeObserver.observe(container);
		updateViewport();
		return () => resizeObserver.disconnect();
	}, []);

	// 当参数变化时重新计算
	useEffect(() => { // recompute on deps
		if (viewportHeight > 0) {
			setRangeIfChanged(computeRange(scrollTop, viewportHeight));
		}
	}, [rowCount, rowHeight, overscan, viewportHeight, scrollTop, computeRange, setRangeIfChanged]);

	// ----- imperative API -----
	// 暴露的API
	useImperativeHandle(ref, () => ({
		scrollToTop: () => updateScrollAndRange(0),
		ensureRangeLoaded,
	}), [updateScrollAndRange, ensureRangeLoaded]);

	// ----- rendered items memo -----
	// 渲染的项目
	const renderedItems = useMemo(() => {
		const { start, end } = range;
		if (!(rowCount > 0 && end >= start)) return null;
		const count = end - start + 1;
		const offsetTop = start * rowHeight - scrollTop;
		return Array.from({ length: count }, (_, i) => {
			const rowIndex = start + i;
			const item = cache.get(rowIndex);
			return renderRow(rowIndex, item, {
				position: 'absolute',
				top: offsetTop + i * rowHeight,
				height: rowHeight,
				left: 0,
				right: 0
			});
		});
	}, [range, rowCount, rowHeight, scrollTop, renderRow, cache]);

	// ----- render -----
	return (
		<div
			ref={containerRef}
			className={`virtual-list ${className}`}
			onWheel={handleWheel}
			role="list"
			aria-rowcount={rowCount}
		>
			<div
				ref={viewportRef}
				className="virtual-list-viewport"
				onScroll={handleHorizontalScroll}
			>
				<div className="virtual-list-items">
					{renderedItems}
				</div>
			</div>
			<Scrollbar
				totalHeight={totalHeight}
				viewportHeight={viewportHeight}
				maxScrollTop={maxScrollTop}
				scrollTop={scrollTop}
				onScrollUpdate={updateScrollAndRange}
			/>
		</div>
	);
});

VirtualList.displayName = 'VirtualList';

export default VirtualList;