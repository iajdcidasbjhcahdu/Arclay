import 'package:flutter/material.dart';
import '../../config/theme.dart';
import '../../models/product.dart';
import '../../services/products_service.dart';
import '../../widgets/product_card.dart';

class ProductsTab extends StatefulWidget {
  final String? initialCategory;

  const ProductsTab({super.key, this.initialCategory});

  @override
  State<ProductsTab> createState() => _ProductsTabState();
}

class _ProductsTabState extends State<ProductsTab> {
  final _productsService = ProductsService();

  List<Product> _products = [];
  List<Category> _categories = [];
  bool _isLoading = true;
  String? _error;

  int _currentPage = 1;
  int _totalPages = 1;
  int _totalProducts = 0;

  // Filters
  String? _selectedCategory;
  String _sort = 'newest';
  double? _minPrice;
  double? _maxPrice;

  final _sortOptions = {
    'newest': 'Newest First',
    'oldest': 'Oldest First',
    'price-low': 'Price: Low → High',
    'price-high': 'Price: High → Low',
    'name-asc': 'Name: A → Z',
    'name-desc': 'Name: Z → A',
  };

  bool get _hasActiveFilters =>
      _selectedCategory != null ||
      _sort != 'newest' ||
      _minPrice != null ||
      _maxPrice != null;

  @override
  void initState() {
    super.initState();
    _selectedCategory = widget.initialCategory;
    _loadProducts();
  }

  Future<void> _loadProducts({int page = 1}) async {
    setState(() {
      _isLoading = true;
      _error = null;
    });

    final response = await _productsService.getProducts(
      page: page,
      limit: 12,
      sort: _sort,
      category: _selectedCategory,
      minPrice: _minPrice,
      maxPrice: _maxPrice,
    );

    if (!mounted) return;

    if (response.success && response.data != null) {
      setState(() {
        _products = response.data!.products;
        _categories = response.data!.categories;
        _currentPage = response.data!.page;
        _totalPages = response.data!.pages;
        _totalProducts = response.data!.total;
        _isLoading = false;
      });
    } else {
      setState(() {
        _error = response.message ?? 'Failed to load products';
        _isLoading = false;
      });
    }
  }

  void _clearFilters() {
    setState(() {
      _selectedCategory = null;
      _sort = 'newest';
      _minPrice = null;
      _maxPrice = null;
    });
    _loadProducts(page: 1);
  }

  void _showSortSheet() {
    showModalBottomSheet(
      context: context,
      builder: (ctx) => Padding(
        padding: const EdgeInsets.fromLTRB(
          AppTheme.spacing24,
          AppTheme.spacing24,
          AppTheme.spacing24,
          AppTheme.spacing32,
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Center(
              child: Container(
                width: 36,
                height: 4,
                margin: const EdgeInsets.only(bottom: AppTheme.spacing20),
                decoration: BoxDecoration(
                  color: AppTheme.borderColor,
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
            ),
            Text('Sort By', style: Theme.of(ctx).textTheme.headlineSmall),
            const SizedBox(height: AppTheme.spacing16),
            ..._sortOptions.entries.map((entry) {
              final isSelected = _sort == entry.key;
              return GestureDetector(
                onTap: () {
                  Navigator.pop(ctx);
                  if (_sort != entry.key) {
                    setState(() => _sort = entry.key);
                    _loadProducts(page: 1);
                  }
                },
                child: Container(
                  margin: const EdgeInsets.only(bottom: AppTheme.spacing8),
                  padding: const EdgeInsets.symmetric(
                    horizontal: AppTheme.spacing16,
                    vertical: AppTheme.spacing12,
                  ),
                  decoration: BoxDecoration(
                    color: isSelected
                        ? AppTheme.primaryColor.withValues(alpha: 0.10)
                        : Colors.transparent,
                    borderRadius: BorderRadius.circular(AppTheme.radiusMd),
                    border: isSelected
                        ? Border.all(color: AppTheme.primaryColor, width: 1.5)
                        : null,
                  ),
                  child: Row(
                    children: [
                      Expanded(
                        child: Text(
                          entry.value,
                          style: Theme.of(ctx).textTheme.bodyLarge?.copyWith(
                            fontWeight: isSelected ? FontWeight.w700 : FontWeight.w400,
                            color: isSelected
                                ? AppTheme.primaryColor
                                : Theme.of(ctx).colorScheme.onSurface,
                          ),
                        ),
                      ),
                      if (isSelected)
                        const Icon(
                          Icons.check_circle_rounded,
                          color: AppTheme.primaryColor,
                          size: 20,
                        ),
                    ],
                  ),
                ),
              );
            }),
          ],
        ),
      ),
    );
  }

  void _showPriceFilter() {
    final minCtrl = TextEditingController(
      text: _minPrice?.toStringAsFixed(0) ?? '',
    );
    final maxCtrl = TextEditingController(
      text: _maxPrice?.toStringAsFixed(0) ?? '',
    );

    showModalBottomSheet(
      context: context,
      builder: (ctx) => Padding(
        padding: EdgeInsets.only(
          left: AppTheme.spacing24,
          right: AppTheme.spacing24,
          top: AppTheme.spacing24,
          bottom: MediaQuery.of(ctx).viewInsets.bottom + AppTheme.spacing32,
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Center(
              child: Container(
                width: 36,
                height: 4,
                margin: const EdgeInsets.only(bottom: AppTheme.spacing20),
                decoration: BoxDecoration(
                  color: AppTheme.borderColor,
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
            ),
            Text('Price Range', style: Theme.of(ctx).textTheme.headlineSmall),
            const SizedBox(height: AppTheme.spacing16),
            Row(
              children: [
                Expanded(
                  child: TextField(
                    controller: minCtrl,
                    keyboardType: TextInputType.number,
                    decoration: const InputDecoration(labelText: 'Min Price (₹)'),
                  ),
                ),
                const Padding(
                  padding: EdgeInsets.symmetric(horizontal: AppTheme.spacing12),
                  child: Text('—'),
                ),
                Expanded(
                  child: TextField(
                    controller: maxCtrl,
                    keyboardType: TextInputType.number,
                    decoration: const InputDecoration(labelText: 'Max Price (₹)'),
                  ),
                ),
              ],
            ),
            const SizedBox(height: AppTheme.spacing20),
            Row(
              children: [
                Expanded(
                  child: OutlinedButton(
                    onPressed: () {
                      Navigator.pop(ctx);
                      setState(() {
                        _minPrice = null;
                        _maxPrice = null;
                      });
                      _loadProducts(page: 1);
                    },
                    child: const Text('Clear'),
                  ),
                ),
                const SizedBox(width: AppTheme.spacing12),
                Expanded(
                  child: ElevatedButton(
                    onPressed: () {
                      Navigator.pop(ctx);
                      setState(() {
                        _minPrice = double.tryParse(minCtrl.text);
                        _maxPrice = double.tryParse(maxCtrl.text);
                      });
                      _loadProducts(page: 1);
                    },
                    child: const Text('Apply'),
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: RefreshIndicator(
        color: AppTheme.primaryColor,
        onRefresh: () => _loadProducts(page: 1),
        child: CustomScrollView(
          physics: const BouncingScrollPhysics(),
          slivers: [
            // ── Header ──────────────────────────────────────
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.fromLTRB(20, 20, 20, 8),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Our Collection',
                      style: Theme.of(context).textTheme.displaySmall,
                    ),
                    const SizedBox(height: AppTheme.spacing4),
                    Text(
                      'Discover premium Indian flavours',
                      style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                        color: AppTheme.textSecondary,
                      ),
                    ),
                  ],
                ),
              ),
            ),

            // ── Category Chips ───────────────────────────────
            SliverToBoxAdapter(
              child: SizedBox(
                height: 46,
                child: ListView(
                  scrollDirection: Axis.horizontal,
                  physics: const BouncingScrollPhysics(),
                  padding: const EdgeInsets.symmetric(
                    horizontal: AppTheme.spacing20,
                  ),
                  children: [
                    _FilterPill(
                      label: 'All',
                      isSelected: _selectedCategory == null,
                      onTap: () {
                        setState(() => _selectedCategory = null);
                        _loadProducts(page: 1);
                      },
                    ),
                    const SizedBox(width: AppTheme.spacing8),
                    ..._categories.map(
                      (cat) => Padding(
                        padding: const EdgeInsets.only(right: AppTheme.spacing8),
                        child: _FilterPill(
                          label: cat.name,
                          isSelected: _selectedCategory == cat.id,
                          onTap: () {
                            setState(() => _selectedCategory = cat.id);
                            _loadProducts(page: 1);
                          },
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ),

            // ── Sort + Filter Bar ────────────────────────────
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.fromLTRB(
                  AppTheme.spacing16,
                  AppTheme.spacing12,
                  AppTheme.spacing16,
                  AppTheme.spacing4,
                ),
                child: Row(
                  children: [
                    _FilterActionButton(
                      icon: Icons.sort_rounded,
                      label: _sortOptions[_sort] ?? 'Sort',
                      isActive: _sort != 'newest',
                      onTap: _showSortSheet,
                    ),
                    const SizedBox(width: AppTheme.spacing8),
                    _FilterActionButton(
                      icon: Icons.currency_rupee_rounded,
                      label: _minPrice != null || _maxPrice != null
                          ? '₹${_minPrice?.toStringAsFixed(0) ?? '0'} – ${_maxPrice?.toStringAsFixed(0) ?? '∞'}'
                          : 'Price',
                      isActive: _minPrice != null || _maxPrice != null,
                      onTap: _showPriceFilter,
                    ),
                    const Spacer(),
                    Text(
                      '$_totalProducts item${_totalProducts != 1 ? 's' : ''}',
                      style: Theme.of(context).textTheme.bodySmall?.copyWith(
                        color: AppTheme.textSecondary,
                      ),
                    ),
                    if (_hasActiveFilters) ...[
                      const SizedBox(width: AppTheme.spacing8),
                      GestureDetector(
                        onTap: _clearFilters,
                        child: Container(
                          padding: const EdgeInsets.all(6),
                          decoration: BoxDecoration(
                            color: AppTheme.accentColor.withValues(alpha: 0.10),
                            borderRadius: BorderRadius.circular(AppTheme.radiusSm),
                          ),
                          child: const Icon(
                            Icons.close_rounded,
                            size: 16,
                            color: AppTheme.accentColor,
                          ),
                        ),
                      ),
                    ],
                  ],
                ),
              ),
            ),

            const SliverToBoxAdapter(child: SizedBox(height: AppTheme.spacing8)),

            // ── Products / States ────────────────────────────
            if (_isLoading)
              const SliverFillRemaining(
                child: Center(
                  child: CircularProgressIndicator(color: AppTheme.primaryColor),
                ),
              )
            else if (_error != null)
              SliverFillRemaining(
                child: Center(
                  child: Padding(
                    padding: const EdgeInsets.all(AppTheme.spacing32),
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        const Icon(
                          Icons.wifi_off_rounded,
                          size: 64,
                          color: AppTheme.textTertiary,
                        ),
                        const SizedBox(height: AppTheme.spacing16),
                        Text(
                          _error!,
                          style: Theme.of(context).textTheme.bodyLarge,
                          textAlign: TextAlign.center,
                        ),
                        const SizedBox(height: AppTheme.spacing24),
                        ElevatedButton(
                          onPressed: () => _loadProducts(page: 1),
                          child: const Text('Retry'),
                        ),
                      ],
                    ),
                  ),
                ),
              )
            else if (_products.isEmpty)
              SliverFillRemaining(
                child: Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Container(
                        width: 80,
                        height: 80,
                        decoration: BoxDecoration(
                          color: AppTheme.primaryColor.withValues(alpha: 0.08),
                          shape: BoxShape.circle,
                        ),
                        child: const Icon(
                          Icons.search_off_rounded,
                          size: 38,
                          color: AppTheme.primaryColor,
                        ),
                      ),
                      const SizedBox(height: AppTheme.spacing16),
                      Text(
                        'No products found',
                        style: Theme.of(context).textTheme.titleLarge,
                      ),
                      if (_hasActiveFilters) ...[
                        const SizedBox(height: AppTheme.spacing8),
                        Text(
                          'Try clearing the filters',
                          style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                            color: AppTheme.textSecondary,
                          ),
                        ),
                        const SizedBox(height: AppTheme.spacing20),
                        OutlinedButton(
                          onPressed: _clearFilters,
                          child: const Text('Clear Filters'),
                        ),
                      ],
                    ],
                  ),
                ),
              )
            else
              SliverPadding(
                padding: const EdgeInsets.symmetric(horizontal: AppTheme.spacing16),
                sliver: SliverGrid(
                  gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                    crossAxisCount: 2,
                    childAspectRatio: 0.67,
                    crossAxisSpacing: AppTheme.spacing12,
                    mainAxisSpacing: AppTheme.spacing12,
                  ),
                  delegate: SliverChildBuilderDelegate(
                    (context, index) => ProductCard(product: _products[index]),
                    childCount: _products.length,
                  ),
                ),
              ),

            // ── Pagination ───────────────────────────────────
            if (!_isLoading && _products.isNotEmpty)
              SliverToBoxAdapter(
                child: Padding(
                  padding: const EdgeInsets.all(AppTheme.spacing24),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      _PaginationButton(
                        label: 'Previous',
                        icon: Icons.chevron_left_rounded,
                        iconAtEnd: false,
                        enabled: _currentPage > 1,
                        onTap: () => _loadProducts(page: _currentPage - 1),
                      ),
                      Padding(
                        padding: const EdgeInsets.symmetric(
                          horizontal: AppTheme.spacing16,
                        ),
                        child: Text(
                          '$_currentPage / $_totalPages',
                          style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                      ),
                      _PaginationButton(
                        label: 'Next',
                        icon: Icons.chevron_right_rounded,
                        iconAtEnd: true,
                        enabled: _currentPage < _totalPages,
                        onTap: () => _loadProducts(page: _currentPage + 1),
                      ),
                    ],
                  ),
                ),
              ),

            const SliverPadding(padding: EdgeInsets.only(bottom: 20)),
          ],
        ),
      ),
    );
  }
}

// ── Filter Pill ───────────────────────────────────────────────────

class _FilterPill extends StatelessWidget {
  final String label;
  final bool isSelected;
  final VoidCallback onTap;

  const _FilterPill({
    required this.label,
    required this.isSelected,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 10),
        decoration: BoxDecoration(
          color: isSelected
              ? AppTheme.primaryColor
              : Theme.of(context).colorScheme.surface,
          borderRadius: BorderRadius.circular(30),
          border: Border.all(
            color: isSelected ? AppTheme.primaryColor : AppTheme.borderColor,
            width: 1.5,
          ),
          boxShadow: isSelected ? AppTheme.goldGlowShadow : AppTheme.softShadow,
        ),
        child: Text(
          label,
          style: TextStyle(
            color: isSelected ? Colors.white : Theme.of(context).colorScheme.onSurface,
            fontWeight: FontWeight.w600,
            fontSize: 13,
          ),
        ),
      ),
    );
  }
}

// ── Filter Action Button ──────────────────────────────────────────

class _FilterActionButton extends StatelessWidget {
  final IconData icon;
  final String label;
  final bool isActive;
  final VoidCallback onTap;

  const _FilterActionButton({
    required this.icon,
    required this.label,
    required this.isActive,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
        decoration: BoxDecoration(
          color: isActive
              ? AppTheme.primaryColor.withValues(alpha: 0.10)
              : Theme.of(context).colorScheme.surface,
          borderRadius: BorderRadius.circular(AppTheme.radiusMd),
          border: Border.all(
            color: isActive ? AppTheme.primaryColor : AppTheme.borderColor,
            width: 1.5,
          ),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(
              icon,
              size: 16,
              color: isActive ? AppTheme.primaryColor : AppTheme.textSecondary,
            ),
            const SizedBox(width: 6),
            Text(
              label,
              style: TextStyle(
                fontSize: 12,
                fontWeight: FontWeight.w600,
                color: isActive ? AppTheme.primaryColor : AppTheme.textSecondary,
              ),
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
            ),
          ],
        ),
      ),
    );
  }
}

// ── Pagination Button ─────────────────────────────────────────────

class _PaginationButton extends StatelessWidget {
  final String label;
  final IconData icon;
  final bool iconAtEnd;
  final bool enabled;
  final VoidCallback onTap;

  const _PaginationButton({
    required this.label,
    required this.icon,
    required this.iconAtEnd,
    required this.enabled,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final color = enabled ? AppTheme.primaryColor : AppTheme.textTertiary;

    return GestureDetector(
      onTap: enabled ? onTap : null,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
        decoration: BoxDecoration(
          color: enabled
              ? AppTheme.primaryColor.withValues(alpha: 0.08)
              : Theme.of(context).colorScheme.surface,
          borderRadius: BorderRadius.circular(AppTheme.radiusMd),
          border: Border.all(
            color: enabled ? AppTheme.primaryColor : AppTheme.borderColor,
            width: 1.5,
          ),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            if (!iconAtEnd) ...[
              Icon(icon, size: 18, color: color),
              const SizedBox(width: 4),
            ],
            Text(
              label,
              style: TextStyle(
                fontSize: 13,
                fontWeight: FontWeight.w600,
                color: color,
              ),
            ),
            if (iconAtEnd) ...[
              const SizedBox(width: 4),
              Icon(icon, size: 18, color: color),
            ],
          ],
        ),
      ),
    );
  }
}
