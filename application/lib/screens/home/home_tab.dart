import 'dart:async';
import 'package:flutter/material.dart';
import 'package:cached_network_image/cached_network_image.dart';
import '../../config/theme.dart';
import '../../config/constants.dart';
import '../../models/product.dart';
import '../../services/products_service.dart';
import '../../services/api_service.dart';
import '../product_detail/product_detail_screen.dart';

class HomeTab extends StatefulWidget {
  final Function(int)? onTabChange;
  final Function(String)? onCategoryTap;

  const HomeTab({super.key, this.onTabChange, this.onCategoryTap});

  @override
  State<HomeTab> createState() => _HomeTabState();
}

class _HomeTabState extends State<HomeTab> {
  final _productsService = ProductsService();

  List<Product> _bestSellers = [];
  List<Product> _newArrivals = [];
  List<Category> _categories = [];
  List<Map<String, dynamic>> _heroAds = [];
  bool _isLoading = true;

  // Hero Carousel
  final PageController _heroPageController = PageController();
  Timer? _heroAutoScroll;
  int _currentHeroPage = 0;

  @override
  void initState() {
    super.initState();
    _loadHomeData();
    _startHeroAutoScroll();
  }

  @override
  void dispose() {
    _heroAutoScroll?.cancel();
    _heroPageController.dispose();
    super.dispose();
  }

  Future<void> _loadHomeData() async {
    setState(() => _isLoading = true);

    // Load Best Sellers (Featured) and New Arrivals in parallel
    final results = await Future.wait([
      _productsService.getProducts(
        page: 1,
        limit: 8,
        sort: 'newest',
      ), // Usually bestsellers route logic, we'll mimic
      _productsService.getHeroAds(),
    ]);

    if (!mounted) return;

    final productsResponse = results[0] as ApiResponse<ProductsResponse>;
    final adsResponse = results[1] as ApiResponse<List<Map<String, dynamic>>>;

    setState(() {
      if (adsResponse.success && adsResponse.data != null) {
        _heroAds = adsResponse.data!;
      }

      if (productsResponse.success && productsResponse.data != null) {
        // Split them out for demo. Assuming backend returns all for now.
        final allProducts = productsResponse.data!.products;
        _categories = productsResponse.data!.categories;

        if (allProducts.length >= 4) {
          _bestSellers = allProducts.sublist(
            0,
            (allProducts.length / 2).ceil(),
          );
          _newArrivals = allProducts.sublist((allProducts.length / 2).ceil());
        } else {
          _bestSellers = List.from(allProducts);
          _newArrivals = List.from(allProducts);
        }
      }

      _isLoading = false;
    });
  }

  void _startHeroAutoScroll() {
    _heroAutoScroll?.cancel();
    _heroAutoScroll = Timer.periodic(const Duration(seconds: 5), (_) {
      if (!mounted || !_heroPageController.hasClients || _heroAds.isEmpty) {
        return;
      }
      final next = (_currentHeroPage + 1) % _heroAds.length;
      _heroPageController.animateToPage(
        next,
        duration: const Duration(milliseconds: 600),
        curve: Curves.easeInOut,
      );
    });
  }

  @override
  Widget build(BuildContext context) {
    return RefreshIndicator(
      onRefresh: _loadHomeData,
      child: CustomScrollView(
        slivers: [
          // ──── Hero Auto-Slider (Full Width) ────
          SliverToBoxAdapter(
            child: SizedBox(
              height: 400,
              child: Stack(
                children: [
                  PageView.builder(
                    controller: _heroPageController,
                    onPageChanged: (idx) =>
                        setState(() => _currentHeroPage = idx),
                    itemCount: _heroAds.isNotEmpty ? _heroAds.length : 1,
                    itemBuilder: (context, index) {
                      if (_heroAds.isEmpty) {
                        return Container(
                          decoration: const BoxDecoration(
                            gradient: AppTheme.warmGradient,
                          ),
                          child: const Center(
                            child: CircularProgressIndicator(
                              color: Colors.white,
                            ),
                          ),
                        );
                      }

                      final banner = _heroAds[index];
                      final hasMedia =
                          banner['mediaUrl'] != null &&
                          banner['mediaUrl'].toString().isNotEmpty;

                      return Stack(
                        fit: StackFit.expand,
                        children: [
                          Container(color: AppTheme.oliveGradient.colors.first),
                          if (hasMedia)
                            CachedNetworkImage(
                              imageUrl: banner['mediaUrl'],
                              fit: BoxFit.cover,
                              placeholder: (context, url) => Container(
                                decoration: const BoxDecoration(
                                  gradient: AppTheme.warmGradient,
                                ),
                              ),
                              errorWidget: (context, url, error) => Container(
                                decoration: const BoxDecoration(
                                  gradient: AppTheme.warmGradient,
                                ),
                              ),
                            )
                          else
                            Container(
                              decoration: const BoxDecoration(
                                gradient: AppTheme.warmGradient,
                              ),
                            ),
                          // Gradient overlay
                          Container(
                            decoration: BoxDecoration(
                              gradient: LinearGradient(
                                colors: [
                                  Colors.black.withValues(alpha: 0.7),
                                  Colors.transparent,
                                ],
                                begin: Alignment.bottomCenter,
                                end: Alignment.topCenter,
                              ),
                            ),
                          ),
                          Positioned(
                            bottom: 40,
                            left: 20,
                            right: 20,
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Container(
                                  padding: const EdgeInsets.symmetric(
                                    horizontal: 12,
                                    vertical: 6,
                                  ),
                                  decoration: BoxDecoration(
                                    color: AppTheme.primaryColor,
                                    borderRadius: BorderRadius.circular(20),
                                  ),
                                  child: const Row(
                                    mainAxisSize: MainAxisSize.min,
                                    children: [
                                      Icon(
                                        Icons.star,
                                        color: Colors.white,
                                        size: 14,
                                      ),
                                      SizedBox(width: 4),
                                      Text(
                                        'Premium Artisanal Collection',
                                        style: TextStyle(
                                          color: Colors.white,
                                          fontSize: 10,
                                          fontWeight: FontWeight.bold,
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
                                const SizedBox(height: 12),
                                Text(
                                  banner['title']?.toString() ?? '',
                                  style: const TextStyle(
                                    color: Colors.white,
                                    fontSize: 28,
                                    fontWeight: FontWeight.w900,
                                    height: 1.1,
                                  ),
                                ),
                                if (banner['description'] != null &&
                                    banner['description']
                                        .toString()
                                        .isNotEmpty) ...[
                                  const SizedBox(height: 8),
                                  Text(
                                    banner['description'].toString(),
                                    style: TextStyle(
                                      color: Colors.white.withValues(
                                        alpha: 0.9,
                                      ),
                                      fontSize: 16,
                                    ),
                                  ),
                                ],
                              ],
                            ),
                          ),
                        ],
                      );
                    },
                  ),
                  Positioned(
                    bottom: 15,
                    left: 0,
                    right: 0,
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: List.generate(
                        _heroAds.length,
                        (idx) => Container(
                          margin: const EdgeInsets.symmetric(horizontal: 4),
                          height: 6,
                          width: _currentHeroPage == idx ? 24 : 6,
                          decoration: BoxDecoration(
                            color: _currentHeroPage == idx
                                ? Colors.white
                                : Colors.white54,
                            borderRadius: BorderRadius.circular(3),
                          ),
                        ),
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),

          // ──── Trust Badges Row ────
          SliverToBoxAdapter(
            child: Container(
              padding: const EdgeInsets.symmetric(vertical: 24, horizontal: 16),
              color: AppTheme.surfaceColor,
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                children: [
                  _buildTrustBadge(
                    Icons.local_shipping_outlined,
                    'Free Shipping',
                    'On orders over ₹999',
                  ),
                  _buildTrustBadge(
                    Icons.eco_outlined,
                    '100% Natural',
                    'No preservatives',
                  ),
                  _buildTrustBadge(
                    Icons.verified_outlined,
                    'Premium',
                    'Quality assured',
                  ),
                ],
              ),
            ),
          ),

          // ──── Categories Grid ────
          if (_categories.isNotEmpty) ...[
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.fromLTRB(16, 32, 16, 16),
                child: Text(
                  'Shop by Category',
                  style: Theme.of(
                    context,
                  ).textTheme.titleLarge?.copyWith(fontWeight: FontWeight.bold),
                ),
              ),
            ),
            SliverToBoxAdapter(
              child: SizedBox(
                height: 116,
                child: ListView.builder(
                  scrollDirection: Axis.horizontal,
                  padding: const EdgeInsets.symmetric(horizontal: 16),
                  itemCount: _categories.length,
                  itemBuilder: (context, index) {
                    final category = _categories[index];
                    return GestureDetector(
                      onTap: () => widget.onCategoryTap?.call(category.id),
                      child: Container(
                        width: 80,
                        margin: const EdgeInsets.only(right: 16),
                        child: Column(
                          children: [
                            Container(
                              width: 80,
                              height: 80,
                              decoration: BoxDecoration(
                                shape: BoxShape.circle,
                                color: AppTheme.surfaceColor,
                                border: Border.all(color: AppTheme.borderColor),
                                boxShadow: AppTheme.cardShadow,
                              ),
                              child:
                                  category.image != null &&
                                      category.image!.isNotEmpty
                                  ? ClipOval(
                                      child: CachedNetworkImage(
                                        imageUrl: category.image!,
                                        fit: BoxFit.cover,
                                        errorWidget: (context, url, error) =>
                                            const Icon(
                                              Icons.category,
                                              color: AppTheme.primaryColor,
                                            ),
                                      ),
                                    )
                                  : const Icon(
                                      Icons.category,
                                      color: AppTheme.primaryColor,
                                      size: 30,
                                    ),
                            ),
                            const SizedBox(height: 8),
                            Text(
                              category.name,
                              style: Theme.of(context).textTheme.bodySmall
                                  ?.copyWith(fontWeight: FontWeight.w600),
                              textAlign: TextAlign.center,
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                            ),
                          ],
                        ),
                      ),
                    );
                  },
                ),
              ),
            ),
          ],

          // ──── Best Sellers Rail ────
          if (_isLoading)
            const SliverToBoxAdapter(
              child: Padding(
                padding: EdgeInsets.all(40.0),
                child: Center(child: CircularProgressIndicator()),
              ),
            )
          else if (_bestSellers.isNotEmpty)
            _buildProductRail(
              context,
              'Best Sellers',
              Icons.local_fire_department,
              AppTheme.accentColor,
              _bestSellers,
              true,
            ),

          // ──── Promo Banner Divider ────
          if (!_isLoading)
            SliverToBoxAdapter(
              child: Container(
                margin: const EdgeInsets.symmetric(vertical: 32),
                height: 120,
                decoration: const BoxDecoration(
                  gradient: AppTheme.oliveGradient,
                ),
                child: Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      const Text(
                        'FESTIVE SPECIAL',
                        style: TextStyle(
                          color: Colors.white,
                          fontWeight: FontWeight.bold,
                          letterSpacing: 2,
                        ),
                      ),
                      const SizedBox(height: 8),
                      Text(
                        'Get 20% Off All Gift Hampers',
                        style: Theme.of(
                          context,
                        ).textTheme.titleLarge?.copyWith(color: Colors.white),
                      ),
                    ],
                  ),
                ),
              ),
            ),

          // ──── New Arrivals Rail ────
          if (!_isLoading && _newArrivals.isNotEmpty)
            _buildProductRail(
              context,
              'New Arrivals',
              Icons.auto_awesome,
              AppTheme.primaryColor,
              _newArrivals,
              false,
            ),

          // ──── Copyright ────
          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.symmetric(
                vertical: AppTheme.spacing24,
                horizontal: AppTheme.spacing16,
              ),
              child: Text(
                '© ${DateTime.now().year} ${AppConstants.appName}. All rights reserved.',
                textAlign: TextAlign.center,
                style: Theme.of(
                  context,
                ).textTheme.bodySmall?.copyWith(color: AppTheme.textSecondary),
              ),
            ),
          ),

          const SliverPadding(padding: EdgeInsets.only(bottom: 40)),
        ],
      ),
    );
  }

  Widget _buildTrustBadge(IconData icon, String title, String subtitle) {
    return Expanded(
      child: Column(
        children: [
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: AppTheme.primaryColor.withValues(alpha: 0.1),
              shape: BoxShape.circle,
            ),
            child: Icon(icon, color: AppTheme.primaryColor, size: 28),
          ),
          const SizedBox(height: 8),
          Text(
            title,
            style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13),
            textAlign: TextAlign.center,
          ),
          Text(
            subtitle,
            style: const TextStyle(fontSize: 11, color: AppTheme.textSecondary),
            textAlign: TextAlign.center,
          ),
        ],
      ),
    );
  }

  Widget _buildProductRail(
    BuildContext context,
    String title,
    IconData icon,
    Color iconColor,
    List<Product> products,
    bool hasWhiteBg,
  ) {
    return SliverToBoxAdapter(
      child: Container(
        color: hasWhiteBg ? AppTheme.surfaceColor : Colors.transparent,
        padding: const EdgeInsets.symmetric(vertical: 24),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              child: Row(
                children: [
                  Icon(icon, color: iconColor, size: 28),
                  const SizedBox(width: 8),
                  Text(
                    title,
                    style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  const Spacer(),
                  TextButton(
                    onPressed: () => widget.onTabChange?.call(1),
                    child: const Text('View All'),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 16),
            SizedBox(
              height: 300,
              child: ListView.builder(
                scrollDirection: Axis.horizontal,
                padding: const EdgeInsets.symmetric(horizontal: 16),
                itemCount: products.length,
                itemBuilder: (context, index) {
                  return Padding(
                    padding: const EdgeInsets.only(right: 16),
                    child: SizedBox(
                      width: 180,
                      child: _ProductCard(product: products[index]),
                    ),
                  );
                },
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _ProductCard extends StatelessWidget {
  final Product product;

  const _ProductCard({required this.product});

  @override
  Widget build(BuildContext context) {
    final hasDiscount = product.hasDiscount;
    final price = product.displayPrice;

    return GestureDetector(
      onTap: () {
        Navigator.of(context).push(
          MaterialPageRoute(
            builder: (_) => ProductDetailScreen(productId: product.id),
          ),
        );
      },
      child: Card(
        elevation: 2,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Expanded(
              flex: 5,
              child: Stack(
                fit: StackFit.expand,
                children: [
                  ClipRRect(
                    borderRadius: const BorderRadius.vertical(
                      top: Radius.circular(16),
                    ),
                    child: product.images.isNotEmpty
                        ? CachedNetworkImage(
                            imageUrl: product.images.first,
                            fit: BoxFit.cover,
                            placeholder: (context, url) => const Center(
                              child: CircularProgressIndicator(),
                            ),
                            errorWidget: (context, url, error) => const Center(
                              child: Icon(
                                Icons.image_outlined,
                                size: 48,
                                color: AppTheme.textSecondary,
                              ),
                            ),
                          )
                        : const Center(
                            child: Icon(
                              Icons.image_outlined,
                              size: 48,
                              color: AppTheme.textSecondary,
                            ),
                          ),
                  ),
                  if (hasDiscount)
                    Positioned(
                      top: 10,
                      left: 10,
                      child: Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 8,
                          vertical: 4,
                        ),
                        decoration: BoxDecoration(
                          color: AppTheme.accentColor,
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: Text(
                          '${product.maxDiscountPercentage}% OFF',
                          style: const TextStyle(
                            color: Colors.white,
                            fontSize: 10,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ),
                    ),
                ],
              ),
            ),
            Expanded(
              flex: 3,
              child: Padding(
                padding: const EdgeInsets.all(12),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        if (product.category != null)
                          Text(
                            product.category!.name.toUpperCase(),
                            style: const TextStyle(
                              color: AppTheme.primaryColor,
                              fontSize: 10,
                              fontWeight: FontWeight.bold,
                            ),
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                          ),
                        const SizedBox(height: 4),
                        Text(
                          product.name,
                          style: const TextStyle(
                            fontSize: 14,
                            fontWeight: FontWeight.w600,
                          ),
                          maxLines: 2,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ],
                    ),
                    Text(
                      '₹${price.toStringAsFixed(0)}',
                      style: const TextStyle(
                        color: AppTheme.textPrimary,
                        fontSize: 16,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
