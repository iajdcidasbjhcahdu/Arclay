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

  final PageController _heroPageController = PageController(viewportFraction: 0.92);
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
        _categories = newResponse.data!.categories;
      }
      _isLoading = false;
    });
  }

  void _startHeroAutoScroll() {
    _heroAutoScroll?.cancel();
    _heroAutoScroll = Timer.periodic(const Duration(seconds: 5), (_) {
      if (!mounted || !_heroPageController.hasClients || _heroAds.isEmpty) return;
      final next = (_currentHeroPage + 1) % _heroAds.length;
      _heroPageController.animateToPage(
        next,
        duration: const Duration(milliseconds: 700),
        curve: Curves.easeInOutCubic,
      );
    });
  }

  String _getGreeting() {
    final hour = DateTime.now().hour;
    String greeting;
    if (hour < 12) {
      greeting = 'Good Morning';
    } else if (hour < 17) {
      greeting = 'Good Afternoon';
    } else {
      greeting = 'Good Evening';
    }

    final user = AuthService().currentUser;
    if (user != null && user.name.isNotEmpty) {
      final firstName = user.name.trim().split(' ').first;
      return '$greeting, $firstName!';
    }
    return '$greeting!';
  }

  String _getUserInitials() {
    final user = AuthService().currentUser;
    if (user != null && user.name.isNotEmpty) {
      return user.name.trim().split(' ').map((w) => w[0]).take(2).join().toUpperCase();
    }
    return '✦';
  }

  @override
  Widget build(BuildContext context) {
    return RefreshIndicator(
      color: AppTheme.primaryColor,
      onRefresh: _loadHomeData,
      child: CustomScrollView(
        physics: const BouncingScrollPhysics(),
        slivers: [
          // ── Greeting ──────────────────────────────────────────
          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.fromLTRB(20, 20, 20, 4),
              child: Row(
                children: [
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          _getGreeting(),
                          style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                            fontWeight: FontWeight.w700,
                          ),
                        ),
                        const SizedBox(height: 2),
                        Text(
                          'What\'s on your plate today?',
                          style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                            color: AppTheme.textSecondary,
                          ),
                        ),
                      ],
                    ),
                  ),
                  // User avatar
                  Container(
                    width: 44,
                    height: 44,
                    decoration: BoxDecoration(
                      gradient: AppTheme.premiumGradient,
                      shape: BoxShape.circle,
                      boxShadow: AppTheme.goldGlowShadow,
                    ),
                    child: Center(
                      child: Text(
                        _getUserInitials(),
                        style: const TextStyle(
                          color: Colors.white,
                          fontSize: 16,
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),

          // ── Hero Carousel ─────────────────────────────────────
          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.only(top: 20, bottom: 8),
              child: SizedBox(
                height: 230,
                child: Stack(
                  alignment: Alignment.bottomCenter,
                  children: [
                    PageView.builder(
                      controller: _heroPageController,
                      onPageChanged: (idx) => setState(() => _currentHeroPage = idx),
                      itemCount: _heroAds.isNotEmpty ? _heroAds.length : 1,
                      itemBuilder: (context, index) {
                        if (_heroAds.isEmpty) {
                          return _buildPlaceholderBanner(context);
                        }
                        return _buildHeroBanner(context, _heroAds[index]);
                      },
                    ),

                    // Dots indicator inside carousel
                    if (_heroAds.length > 1)
                      Positioned(
                        bottom: 14,
                        child: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: List.generate(_heroAds.length, (idx) {
                            final isActive = idx == _currentHeroPage;
                            return AnimatedContainer(
                              duration: const Duration(milliseconds: 300),
                              curve: Curves.easeInOut,
                              margin: const EdgeInsets.symmetric(horizontal: 3),
                              height: 6,
                              width: isActive ? 22 : 6,
                              decoration: BoxDecoration(
                                color: isActive
                                    ? AppTheme.primaryColor
                                    : Colors.white.withValues(alpha: 0.6),
                                borderRadius: BorderRadius.circular(3),
                              ),
                            );
                          }),
                        ),
                      ),
                  ],
                ),
              ),
            ),
          ),

          // ── Trust Badges ──────────────────────────────────────
          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.fromLTRB(16, 16, 16, 8),
              child: Row(
                children: [
                  _TrustBadge(
                    icon: Icons.local_shipping_outlined,
                    label: 'Free Ship',
                    sublabel: '₹999+',
                  ),
                  _TrustBadge(
                    icon: Icons.eco_outlined,
                    label: '100% Natural',
                    sublabel: 'No additives',
                  ),
                  _TrustBadge(
                    icon: Icons.verified_outlined,
                    label: 'Premium',
                    sublabel: 'Quality assured',
                  ),
                ],
              ),
            ),
          ),

          // ── Categories ────────────────────────────────────────
          if (_categories.isNotEmpty) ...[
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.fromLTRB(20, 24, 20, 12),
                child: _SectionHeader(
                  title: 'Explore Categories',
                  onSeeAll: () => widget.onTabChange?.call(1),
                ),
              ),
            ),
            SliverToBoxAdapter(
              child: SizedBox(
                height: 44,
                child: ListView.builder(
                  scrollDirection: Axis.horizontal,
                  physics: const BouncingScrollPhysics(),
                  padding: const EdgeInsets.symmetric(horizontal: 20),
                  itemCount: _categories.length,
                  itemBuilder: (context, index) {
                    final category = _categories[index];
                    return _CategoryChip(
                      label: category.name,
                      onTap: () => widget.onCategoryTap?.call(category.id),
                    );
                  },
                ),
              ),
            ),
          ],

          // ── Best Sellers ──────────────────────────────────────
          if (_isLoading)
            const SliverToBoxAdapter(
              child: Padding(
                padding: EdgeInsets.all(48.0),
                child: Center(
                  child: CircularProgressIndicator(color: AppTheme.primaryColor),
                ),
              ),
            )
          else if (_bestSellers.isNotEmpty)
            _buildProductSection(
              context,
              title: 'Best Sellers',
              icon: Icons.local_fire_department_rounded,
              iconColor: AppTheme.accentColor,
              products: _bestSellers,
              hasBackground: true,
            ),

          // ── Promo Banner ──────────────────────────────────────
          if (!_isLoading)
            SliverToBoxAdapter(
              child: Container(
                margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 24),
                height: 110,
                decoration: BoxDecoration(
                  gradient: AppTheme.authHeaderGradient,
                  borderRadius: BorderRadius.circular(AppTheme.radius2xl),
                  boxShadow: AppTheme.elevatedShadow,
                ),
                child: Stack(
                  children: [
                    // Decorative circles
                    Positioned(
                      right: -20,
                      top: -20,
                      child: Container(
                        width: 120,
                        height: 120,
                        decoration: BoxDecoration(
                          shape: BoxShape.circle,
                          color: AppTheme.primaryColor.withValues(alpha: 0.10),
                        ),
                      ),
                    ),
                    Positioned(
                      right: 30,
                      bottom: -30,
                      child: Container(
                        width: 80,
                        height: 80,
                        decoration: BoxDecoration(
                          shape: BoxShape.circle,
                          color: AppTheme.primaryColor.withValues(alpha: 0.06),
                        ),
                      ),
                    ),
                    // Content
                    Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 20),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                            decoration: BoxDecoration(
                              color: AppTheme.primaryColor,
                              borderRadius: BorderRadius.circular(20),
                            ),
                            child: const Text(
                              'FESTIVE SPECIAL',
                              style: TextStyle(
                                color: Colors.white,
                                fontSize: 10,
                                fontWeight: FontWeight.w700,
                                letterSpacing: 1.2,
                              ),
                            ),
                          ),
                          const SizedBox(height: 8),
                          const Text(
                            'Get 20% Off All Gift Hampers',
                            style: TextStyle(
                              color: Colors.white,
                              fontSize: 17,
                              fontWeight: FontWeight.w700,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            ),

          // ── New Arrivals ───────────────────────────────────────
          if (!_isLoading && _newArrivals.isNotEmpty)
            _buildProductSection(
              context,
              title: 'New Arrivals',
              icon: Icons.auto_awesome_rounded,
              iconColor: AppTheme.primaryColor,
              products: _newArrivals,
              hasBackground: false,
            ),

          // ── Footer ────────────────────────────────────────────
          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.symmetric(vertical: AppTheme.spacing24, horizontal: AppTheme.spacing16),
              child: Text(
                '© ${DateTime.now().year} ${AppConstants.appName}. All rights reserved.',
                textAlign: TextAlign.center,
                style: Theme.of(context).textTheme.bodySmall?.copyWith(
                  color: AppTheme.textTertiary,
                ),
              ),
            ),
          ),

          const SliverPadding(padding: EdgeInsets.only(bottom: 20)),
        ],
      ),
    );
  }

  Widget _buildPlaceholderBanner(BuildContext context) {
    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 8),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(AppTheme.radius2xl),
        gradient: AppTheme.authHeaderGradient,
      ),
      child: const Center(
        child: CircularProgressIndicator(color: AppTheme.primaryColor),
      ),
    );
  }

  Widget _buildHeroBanner(BuildContext context, Map<String, dynamic> banner) {
    final hasMedia =
        banner['mediaUrl'] != null && banner['mediaUrl'].toString().isNotEmpty;

    final hasValidLink =
        banner['linkUrl'] != null &&
        banner['linkUrl'].toString().startsWith('/products/');

    Widget content = Container(
      margin: const EdgeInsets.symmetric(horizontal: 8),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(AppTheme.radius2xl),
        image: hasMedia
            ? DecorationImage(
                image: CachedNetworkImageProvider(banner['mediaUrl']),
                fit: BoxFit.cover,
              )
            : null,
        gradient: hasMedia ? null : AppTheme.authHeaderGradient,
        boxShadow: AppTheme.elevatedShadow,
      ),
      child: Container(
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(AppTheme.radius2xl),
          gradient: AppTheme.heroOverlay,
        ),
        padding: const EdgeInsets.fromLTRB(22, 16, 22, 44),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.end,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
              decoration: BoxDecoration(
                color: AppTheme.primaryColor,
                borderRadius: BorderRadius.circular(20),
              ),
              child: const Text(
                'NEW ARRIVAL',
                style: TextStyle(
                  color: Colors.white,
                  fontSize: 10,
                  fontWeight: FontWeight.w700,
                  letterSpacing: 1.2,
                ),
              ),
            ),
            const SizedBox(height: 10),
            Text(
              banner['title']?.toString() ?? 'Premium Collection',
              style: const TextStyle(
                color: Colors.white,
                fontSize: 22,
                fontWeight: FontWeight.w800,
                height: 1.2,
              ),
              maxLines: 2,
              overflow: TextOverflow.ellipsis,
            ),
            if (banner['description'] != null &&
                banner['description'].toString().isNotEmpty) ...[
              const SizedBox(height: 6),
              Text(
                banner['description'].toString(),
                style: TextStyle(
                  color: Colors.white.withValues(alpha: 0.85),
                  fontSize: 13,
                ),
                maxLines: 1,
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
          final productId = banner['linkUrl'].toString().split('/').last;
          Navigator.of(context).push(
            MaterialPageRoute(
              builder: (_) => ProductDetailScreen(productId: productId),
            ),
          );
        },
        child: content,
      );
    }

    return content;
  }

  Widget _buildProductSection(
    BuildContext context, {
    required String title,
    required IconData icon,
    required Color iconColor,
    required List<Product> products,
    required bool hasBackground,
  }) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return SliverToBoxAdapter(
      child: Container(
        color: hasBackground
            ? (isDark
                ? Colors.black.withValues(alpha: 0.15)
                : AppTheme.cream.withValues(alpha: 0.5))
            : Colors.transparent,
        padding: const EdgeInsets.symmetric(vertical: 24),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 20),
              child: Row(
                children: [
                  Container(
                    width: 4,
                    height: 20,
                    decoration: BoxDecoration(
                      gradient: AppTheme.premiumGradient,
                      borderRadius: BorderRadius.circular(2),
                    ),
                  ),
                  const SizedBox(width: 10),
                  Text(
                    title,
                    style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                  const Spacer(),
                  GestureDetector(
                    onTap: () => widget.onTabChange?.call(1),
                    child: Text(
                      'See All',
                      style: Theme.of(context).textTheme.labelMedium?.copyWith(
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
                  childAspectRatio: 0.67,
                  crossAxisSpacing: 14,
                  mainAxisSpacing: 14,
                ),
                itemCount: products.length,
                itemBuilder: (context, index) => ProductCard(product: products[index]),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

// ── Section Header ────────────────────────────────────────────────

class _SectionHeader extends StatelessWidget {
  final String title;
  final VoidCallback? onSeeAll;

  const _SectionHeader({required this.title, this.onSeeAll});

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Container(
          width: 4,
          height: 20,
          decoration: BoxDecoration(
            gradient: AppTheme.premiumGradient,
            borderRadius: BorderRadius.circular(2),
          ),
        ),
        const SizedBox(width: 10),
        Text(
          title,
          style: Theme.of(context).textTheme.headlineSmall?.copyWith(
            fontWeight: FontWeight.w700,
          ),
        ),
        if (onSeeAll != null) ...[
          const Spacer(),
          GestureDetector(
            onTap: onSeeAll,
            child: Text(
              'See All',
              style: Theme.of(context).textTheme.labelMedium?.copyWith(
                color: AppTheme.primaryColor,
                fontWeight: FontWeight.w600,
              ),
            ),
          ),
        ],
      ],
    );
  }
}

// ── Category Chip ─────────────────────────────────────────────────

class _CategoryChip extends StatelessWidget {
  final String label;
  final VoidCallback onTap;

  const _CategoryChip({required this.label, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        margin: const EdgeInsets.only(right: 10),
        padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 10),
        decoration: BoxDecoration(
          color: Theme.of(context).colorScheme.surface,
          borderRadius: BorderRadius.circular(30),
          border: Border.all(color: AppTheme.borderColor, width: 1.5),
          boxShadow: AppTheme.softShadow,
        ),
        child: Text(
          label,
          style: Theme.of(context).textTheme.labelLarge?.copyWith(
            color: Theme.of(context).colorScheme.onSurface,
            fontWeight: FontWeight.w600,
          ),
        ),
      ),
    );
  }
}

// ── Trust Badge ───────────────────────────────────────────────────

class _TrustBadge extends StatelessWidget {
  final IconData icon;
  final String label;
  final String sublabel;

  const _TrustBadge({
    required this.icon,
    required this.label,
    required this.sublabel,
  });

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: Container(
        margin: const EdgeInsets.symmetric(horizontal: 4),
        padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 8),
        decoration: BoxDecoration(
          color: Theme.of(context).colorScheme.surface,
          borderRadius: BorderRadius.circular(AppTheme.radiusMd),
          border: Border.all(color: AppTheme.borderColor, width: 1),
        ),
        child: Column(
          children: [
            Icon(icon, color: AppTheme.primaryColor, size: 22),
            const SizedBox(height: 6),
            Text(
              label,
              style: const TextStyle(
                fontWeight: FontWeight.w700,
                fontSize: 11,
              ),
              textAlign: TextAlign.center,
              maxLines: 1,
            ),
            Text(
              sublabel,
              style: const TextStyle(
                fontSize: 10,
                color: AppTheme.textSecondary,
              ),
              textAlign: TextAlign.center,
              maxLines: 1,
            ),
          ],
        ),
      ),
    );
  }
}
