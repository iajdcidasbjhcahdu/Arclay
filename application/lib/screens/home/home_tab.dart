import 'dart:async';
import 'package:flutter/material.dart';
import 'package:cached_network_image/cached_network_image.dart';
import '../../config/theme.dart';
import '../../config/constants.dart';
import '../../models/product.dart';
import '../../services/products_service.dart';
import '../../services/api_service.dart';
import '../../services/auth_service.dart';
import '../../widgets/product_card.dart';
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

    // Load Best Sellers, New Arrivals and Hero Ads in parallel
    final results = await Future.wait([
      _productsService.getProducts(page: 1, limit: 4, isFeatured: true),
      _productsService.getProducts(page: 1, limit: 4, sort: 'newest'),
      _productsService.getHeroAds(),
    ]);

    if (!mounted) return;

    final featuredResponse = results[0] as ApiResponse<ProductsResponse>;
    final newResponse = results[1] as ApiResponse<ProductsResponse>;
    final adsResponse = results[2] as ApiResponse<List<Map<String, dynamic>>>;

    setState(() {
      if (adsResponse.success && adsResponse.data != null) {
        _heroAds = adsResponse.data!;
      }

      if (featuredResponse.success && featuredResponse.data != null) {
        _bestSellers = featuredResponse.data!.products;
      }

      if (newResponse.success && newResponse.data != null) {
        _newArrivals = newResponse.data!.products;
        // Categories can be extracted from any product response
        _categories = newResponse.data!.categories;
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

  String _getGreeting() {
    final hour = DateTime.now().hour;
    String timeOfDay;
    if (hour < 12) {
      timeOfDay = 'Good Morning';
    } else if (hour < 17) {
      timeOfDay = 'Good Afternoon';
    } else {
      timeOfDay = 'Good Evening';
    }

    final user = AuthService().currentUser;
    if (user != null && user.name.isNotEmpty) {
      final firstName = user.name.trim().split(' ').first;
      return '$timeOfDay, $firstName';
    }
    return timeOfDay;
  }

  @override
  Widget build(BuildContext context) {
    return RefreshIndicator(
      onRefresh: _loadHomeData,
      child: CustomScrollView(
        slivers: [
          // ──── Greeting Section ────
          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.fromLTRB(20, 24, 20, 0),
              child: Text(
                _getGreeting(),
                style: Theme.of(context).textTheme.titleLarge?.copyWith(
                  fontWeight: FontWeight.bold,
                  color: Theme.of(context).colorScheme.onSurface,
                ),
              ),
            ),
          ),

          // ──── Hero Auto-Slider (Card Based) ────
          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.only(top: 16.0, bottom: 20.0),
              child: SizedBox(
                height: 220,
                child: PageView.builder(
                  controller: PageController(viewportFraction: 0.9),
                  onPageChanged: (idx) =>
                      setState(() => _currentHeroPage = idx),
                  itemCount: _heroAds.isNotEmpty ? _heroAds.length : 1,
                  itemBuilder: (context, index) {
                    if (_heroAds.isEmpty) {
                      return Container(
                        margin: const EdgeInsets.symmetric(horizontal: 8),
                        decoration: BoxDecoration(
                          borderRadius: BorderRadius.circular(24),
                          gradient: AppTheme.premiumGradient,
                        ),
                        child: const Center(
                          child: CircularProgressIndicator(color: Colors.white),
                        ),
                      );
                    }

                    final banner = _heroAds[index];
                    final hasMedia =
                        banner['mediaUrl'] != null &&
                        banner['mediaUrl'].toString().isNotEmpty;

                    final hasValidLink =
                        banner['linkUrl'] != null &&
                        banner['linkUrl'].toString().startsWith('/products/');

                    Widget bannerContent = Container(
                      margin: const EdgeInsets.symmetric(horizontal: 8),
                      decoration: BoxDecoration(
                        borderRadius: BorderRadius.circular(24),
                        image: hasMedia
                            ? DecorationImage(
                                image: CachedNetworkImageProvider(
                                  banner['mediaUrl'],
                                ),
                                fit: BoxFit.cover,
                              )
                            : null,
                        color: hasMedia ? null : AppTheme.primaryColor,
                        boxShadow: [
                          BoxShadow(
                            color: Colors.black.withValues(alpha: 0.15),
                            blurRadius: 15,
                            offset: const Offset(0, 10),
                          ),
                        ],
                      ),
                      child: Container(
                        decoration: BoxDecoration(
                          borderRadius: BorderRadius.circular(24),
                          gradient: LinearGradient(
                            colors: [
                              Colors.black.withValues(alpha: 0.7),
                              Colors.transparent,
                            ],
                            begin: Alignment.bottomLeft,
                            end: Alignment.topRight,
                          ),
                        ),
                        padding: const EdgeInsets.all(24.0),
                        child: Column(
                          mainAxisAlignment: MainAxisAlignment.end,
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Container(
                              padding: const EdgeInsets.symmetric(
                                horizontal: 10,
                                vertical: 4,
                              ),
                              decoration: BoxDecoration(
                                color: const Color(0xFFD4AF37),
                                borderRadius: BorderRadius.circular(20),
                              ),
                              child: const Text(
                                'NEW ARRIVAL',
                                style: TextStyle(
                                  color: Colors.white,
                                  fontSize: 10,
                                  fontWeight: FontWeight.bold,
                                  letterSpacing: 1,
                                ),
                              ),
                            ),
                            const SizedBox(height: 10),
                            Text(
                              banner['title']?.toString() ??
                                  'Premium\nCollection',
                              style: const TextStyle(
                                color: Colors.white,
                                fontSize: 24,
                                fontWeight: FontWeight.bold,
                                height: 1.2,
                              ),
                              maxLines: 2,
                              overflow: TextOverflow.ellipsis,
                            ),
                            if (banner['description'] != null &&
                                banner['description']
                                    .toString()
                                    .isNotEmpty) ...[
                              const SizedBox(height: 8),
                              Text(
                                banner['description'].toString(),
                                style: TextStyle(
                                  color: Colors.white.withValues(alpha: 0.9),
                                  fontSize: 14,
                                ),
                                maxLines: 2,
                                overflow: TextOverflow.ellipsis,
                              ),
                            ],
                          ],
                        ),
                      ),
                    );

                    if (hasValidLink) {
                      return GestureDetector(
                        onTap: () {
                          final productId = banner['linkUrl']
                              .toString()
                              .split('/')
                              .last;
                          Navigator.of(context).push(
                            MaterialPageRoute(
                              builder: (_) =>
                                  ProductDetailScreen(productId: productId),
                            ),
                          );
                        },
                        child: bannerContent,
                      );
                    }

                    return bannerContent;
                  },
                ),
              ),
            ),
          ),

          // ──── Trust Badges Row ────
          SliverToBoxAdapter(
            child: Container(
              padding: const EdgeInsets.symmetric(vertical: 24, horizontal: 16),
              color: AppTheme.surfaceColor.withValues(alpha: 0.04),
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
                padding: const EdgeInsets.fromLTRB(20, 32, 20, 16),
                child: Text(
                  'Explore Categories',
                  style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                    fontWeight: FontWeight.bold,
                    color: Theme.of(context).colorScheme.onSurface,
                  ),
                ),
              ),
            ),
            SliverToBoxAdapter(
              child: SizedBox(
                height: 45,
                child: ListView.builder(
                  scrollDirection: Axis.horizontal,
                  physics: const BouncingScrollPhysics(),
                  padding: const EdgeInsets.symmetric(horizontal: 20),
                  itemCount: _categories.length,
                  itemBuilder: (context, index) {
                    final category = _categories[index];
                    // Using index 0 as selected for demo purposes if no active category state exists
                    bool isSelected = index == 0;
                    return GestureDetector(
                      onTap: () => widget.onCategoryTap?.call(category.id),
                      child: Container(
                        margin: const EdgeInsets.only(right: 12),
                        padding: const EdgeInsets.symmetric(
                          horizontal: 24,
                          vertical: 10,
                        ),
                        decoration: BoxDecoration(
                          color: isSelected
                              ? Theme.of(context).colorScheme.onSurface
                              : Theme.of(context).colorScheme.surface,
                          borderRadius: BorderRadius.circular(30),
                          border: Border.all(
                            color: isSelected
                                ? Theme.of(context).colorScheme.onSurface
                                : Theme.of(context).dividerColor,
                          ),
                          boxShadow: isSelected
                              ? [
                                  BoxShadow(
                                    color: Colors.black.withValues(alpha: 0.2),
                                    blurRadius: 8,
                                    offset: const Offset(0, 4),
                                  ),
                                ]
                              : [],
                        ),
                        child: Center(
                          child: Text(
                            category.name,
                            style: TextStyle(
                              color: isSelected
                                  ? Theme.of(context).colorScheme.surface
                                  : Theme.of(context).colorScheme.onSurface,
                              fontWeight: isSelected
                                  ? FontWeight.bold
                                  : FontWeight.w500,
                              fontFamily: 'sans-serif',
                            ),
                          ),
                        ),
                      ),
                    );
                  },
                ),
              ),
            ),
          ],

          // ──── Best Sellers Grid ────
          if (_isLoading)
            const SliverToBoxAdapter(
              child: Padding(
                padding: EdgeInsets.all(40.0),
                child: Center(child: CircularProgressIndicator()),
              ),
            )
          else if (_bestSellers.isNotEmpty)
            _buildProductGrid(
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
                  gradient: AppTheme.premiumGradient,
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

          // ──── New Arrivals Grid ────
          if (!_isLoading && _newArrivals.isNotEmpty)
            _buildProductGrid(
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

  Widget _buildProductGrid(
    BuildContext context,
    String title,
    IconData icon,
    Color iconColor,
    List<Product> products,
    bool hasWhiteBg,
  ) {
    return SliverToBoxAdapter(
      child: Container(
        color: hasWhiteBg
            ? (Theme.of(context).brightness == Brightness.dark
                  ? Colors.black.withValues(alpha: 0.04)
                  : Theme.of(context).colorScheme.surface)
            : Colors.transparent,
        padding: const EdgeInsets.symmetric(vertical: 24),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              child: Row(
                children: [
                  Text(
                    title,
                    style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                      fontWeight: FontWeight.bold,
                      color: Theme.of(context).colorScheme.onSurface,
                    ),
                  ),
                  const Spacer(),
                  TextButton(
                    onPressed: () => widget.onTabChange?.call(1),
                    child: const Text(
                      'See All',
                      style: TextStyle(
                        fontSize: 14,
                        color: AppTheme.primaryColor,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 16),
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              child: GridView.builder(
                shrinkWrap: true,
                physics: const NeverScrollableScrollPhysics(),
                gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                  crossAxisCount: 2,
                  childAspectRatio: 0.65,
                  crossAxisSpacing: 16,
                  mainAxisSpacing: 16,
                ),
                itemCount: products.length,
                itemBuilder: (context, index) {
                  return ProductCard(product: products[index]);
                },
              ),
            ),
          ],
        ),
      ),
    );
  }
}
