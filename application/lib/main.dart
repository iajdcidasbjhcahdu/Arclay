import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'config/theme.dart';
import 'config/constants.dart';
import 'services/auth_service.dart';
import 'services/api_service.dart';
import 'screens/home/home_screen.dart';
import 'screens/auth/login_screen.dart';
import 'package:flutter_svg/flutter_svg.dart';

// Global theme notifier
final ValueNotifier<ThemeMode> themeNotifier = ValueNotifier(ThemeMode.light);

void main() async {
  WidgetsFlutterBinding.ensureInitialized();

  // Set status bar color
  SystemChrome.setSystemUIOverlayStyle(
    const SystemUiOverlayStyle(
      statusBarColor: Colors.transparent,
      statusBarIconBrightness: Brightness.dark,
    ),
  );

  // Initialize services
  await ApiService().init();
  await AuthService().init();

  // Load saved theme preference
  final prefs = await SharedPreferences.getInstance();
  final isDark = prefs.getBool('is_dark_mode') ?? false;
  themeNotifier.value = isDark ? ThemeMode.dark : ThemeMode.light;

  runApp(const MyApp());
}

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context) {
    return ValueListenableBuilder<ThemeMode>(
      valueListenable: themeNotifier,
      builder: (context, mode, _) {
        return MaterialApp(
          title: AppConstants.appName,
          debugShowCheckedModeBanner: false,
          theme: AppTheme.buildTheme(),
          darkTheme: AppTheme.buildDarkTheme(),
          themeMode: mode,
          home: const SplashScreen(),
        );
      },
    );
  }
}

class SplashScreen extends StatefulWidget {
  const SplashScreen({super.key});

  @override
  State<SplashScreen> createState() => _SplashScreenState();
}

class _SplashScreenState extends State<SplashScreen> {
  List<dynamic> _splashScreens = [];
  int _currentIndex = 0;
  bool _isLoading = true;
  bool _isNavigating = false;
  final PageController _pageController = PageController();

  @override
  void initState() {
    super.initState();
    _fetchSplashAndCheckAuth();
  }

  @override
  void dispose() {
    _pageController.dispose();
    super.dispose();
  }

  Future<void> _fetchSplashAndCheckAuth() async {
    final prefs = await SharedPreferences.getInstance();
    final hasSeenSplash = prefs.getBool('has_seen_splash') ?? false;

    if (hasSeenSplash) {
      if (mounted) setState(() => _isLoading = false);
      _navigate();
      return;
    }

    try {
      // 1. Fetch splash config from API
      final response = await ApiService().get<Map<String, dynamic>>(
        '/api/app-config',
        fromJson: (json) => json as Map<String, dynamic>,
      );

      if (response.success && response.data != null && mounted) {
        final config = response.data!['config'];
        setState(() {
          _splashScreens = List<dynamic>.from(config['splashScreens'] ?? []);
        });
      }
    } catch (e) {
      debugPrint('Failed to load splash config: $e');
    }

    if (!mounted) return;
    setState(() => _isLoading = false);

    if (_splashScreens.isEmpty) {
      // Fallback: wait a minimum time so the fallback UI doesnt flash too fast
      await Future.delayed(const Duration(seconds: 2));
      _navigate();
    }
  }

  void _handleNext() {
    if (_currentIndex < _splashScreens.length - 1) {
      _pageController.nextPage(
        duration: const Duration(milliseconds: 300),
        curve: Curves.easeInOut,
      );
    } else {
      _navigate();
    }
  }

  void _navigate() async {
    if (!mounted || _isNavigating) return;
    _isNavigating = true;

    final prefs = await SharedPreferences.getInstance();
    await prefs.setBool('has_seen_splash', true);

    final authService = AuthService();
    // Navigate based on auth status
    if (authService.isAuthenticated) {
      Navigator.of(
        context,
      ).pushReplacement(MaterialPageRoute(builder: (_) => const HomeScreen()));
    } else {
      Navigator.of(
        context,
      ).pushReplacement(MaterialPageRoute(builder: (_) => const LoginScreen()));
    }
  }

  Color _parseColor(String hexColor, Color fallback) {
    hexColor = hexColor.toUpperCase().replaceAll("#", "");
    if (hexColor.length == 6) {
      hexColor = "FF$hexColor";
    }
    return int.tryParse(hexColor, radix: 16) != null
        ? Color(int.parse(hexColor, radix: 16))
        : fallback;
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) {
      return const Scaffold(body: Center(child: CircularProgressIndicator()));
    }

    // If disabled via backend or empty, fallback to default UI immediately
    if (_splashScreens.isEmpty) {
      return Scaffold(
        body: Container(
          decoration: const BoxDecoration(gradient: AppTheme.warmGradient),
          child: Center(
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Text(
                  AppConstants.appName,
                  style: Theme.of(context).textTheme.headlineLarge?.copyWith(
                    color: AppTheme.primaryColor,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                const SizedBox(height: AppTheme.spacing16),
                Text(
                  AppConstants.appDescription,
                  style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                    color: AppTheme.textSecondary,
                  ),
                  textAlign: TextAlign.center,
                ),
                const SizedBox(height: AppTheme.spacing48),
                const CircularProgressIndicator(
                  valueColor: AlwaysStoppedAnimation<Color>(
                    AppTheme.primaryColor,
                  ),
                ),
              ],
            ),
          ),
        ),
      );
    }

    // Dynamic UI sequence using PageView
    final currentScreenBackgroundColor =
        _splashScreens[_currentIndex]['backgroundColor'];
    final safeBgColor = currentScreenBackgroundColor != null
        ? _parseColor(currentScreenBackgroundColor, Colors.white)
        : Colors.white;

    return Scaffold(
      backgroundColor: safeBgColor,
      body: Stack(
        children: [
          PageView.builder(
            controller: _pageController,
            onPageChanged: (index) {
              setState(() {
                _currentIndex = index;
              });
            },
            itemCount: _splashScreens.length,
            itemBuilder: (context, index) {
              final screen = _splashScreens[index];
              final bgColor = screen['backgroundColor'] != null
                  ? _parseColor(screen['backgroundColor'], Colors.white)
                  : Colors.white;

              final title = screen['title'] ?? AppConstants.appName;
              final description =
                  screen['description'] ?? AppConstants.appDescription;
              final imageUrl = screen['imageUrl'];
              final imageType = screen['imageType'];

              // Calculate perceived brightness to determine text color
              final brightness = ThemeData.estimateBrightnessForColor(bgColor);
              final textColor = brightness == Brightness.dark
                  ? Colors.white
                  : AppTheme.textPrimary;
              final secondaryTextColor = brightness == Brightness.dark
                  ? Colors.white70
                  : AppTheme.textSecondary;

              return Container(
                color: bgColor,
                padding: const EdgeInsets.symmetric(horizontal: 24.0),
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    if (imageUrl != null && imageUrl.toString().isNotEmpty) ...[
                      (() {
                        final urlStr = imageUrl.toString().toLowerCase();
                        final isSvg =
                            (imageType == 'svg' || urlStr.endsWith('.svg')) &&
                            !urlStr.endsWith('.webp') &&
                            !urlStr.endsWith('.png') &&
                            !urlStr.endsWith('.jpg') &&
                            !urlStr.endsWith('.jpeg');

                        if (isSvg) {
                          return SvgPicture.network(
                            imageUrl,
                            height: 200,
                            width: 200,
                            placeholderBuilder: (BuildContext context) =>
                                const SizedBox(
                                  height: 200,
                                  width: 200,
                                  child: Center(
                                    child: CircularProgressIndicator(),
                                  ),
                                ),
                          );
                        } else {
                          return Image.network(
                            imageUrl,
                            height: 200,
                            width: 200,
                            loadingBuilder: (context, child, loadingProgress) {
                              if (loadingProgress == null) return child;
                              return const SizedBox(
                                height: 200,
                                width: 200,
                                child: Center(
                                  child: CircularProgressIndicator(),
                                ),
                              );
                            },
                            errorBuilder: (context, error, stackTrace) => Icon(
                              Icons.broken_image,
                              size: 120,
                              color: textColor.withOpacity(0.5),
                            ),
                          );
                        }
                      })(),
                      const SizedBox(height: AppTheme.spacing48),
                    ],
                    Text(
                      title,
                      style: Theme.of(context).textTheme.headlineMedium
                          ?.copyWith(
                            color: textColor,
                            fontWeight: FontWeight.bold,
                          ),
                      textAlign: TextAlign.center,
                    ),
                    const SizedBox(height: AppTheme.spacing16),
                    Text(
                      description,
                      style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                        color: secondaryTextColor,
                      ),
                      textAlign: TextAlign.center,
                    ),
                    const SizedBox(height: 100), // padding for bottom controls
                  ],
                ),
              );
            },
          ),

          // Bottom Controls (Dots & Button)
          Positioned(
            bottom: 40,
            left: 24,
            right: 24,
            child: Column(
              children: [
                // Dots Indicator
                if (_splashScreens.length > 1)
                  Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: List.generate(_splashScreens.length, (idx) {
                      // Use contrast color based on current screen background
                      final brightness = ThemeData.estimateBrightnessForColor(
                        safeBgColor,
                      );
                      final indicatorColor = brightness == Brightness.dark
                          ? Colors.white
                          : AppTheme.primaryColor;

                      return AnimatedContainer(
                        duration: const Duration(milliseconds: 300),
                        margin: const EdgeInsets.symmetric(horizontal: 4),
                        height: 8,
                        width: idx == _currentIndex ? 24 : 8,
                        decoration: BoxDecoration(
                          color: idx == _currentIndex
                              ? indicatorColor
                              : indicatorColor.withOpacity(0.3),
                          borderRadius: BorderRadius.circular(4),
                        ),
                      );
                    }),
                  ),

                const SizedBox(height: 32),

                // Continue / Get Started Button
                SizedBox(
                  width: double.infinity,
                  height: 56,
                  child: ElevatedButton(
                    onPressed: _handleNext,
                    style: ElevatedButton.styleFrom(
                      backgroundColor:
                          ThemeData.estimateBrightnessForColor(safeBgColor) ==
                              Brightness.dark
                          ? Colors.white
                          : AppTheme.primaryColor,
                      foregroundColor:
                          ThemeData.estimateBrightnessForColor(safeBgColor) ==
                              Brightness.dark
                          ? AppTheme.primaryColor
                          : Colors.white,
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(16),
                      ),
                      elevation: 4,
                    ),
                    child: Text(
                      _currentIndex == _splashScreens.length - 1
                          ? 'Get Started'
                          : 'Continue',
                      style: const TextStyle(
                        fontSize: 18,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ),
                ),
              ],
            ),
          ),

          // Skip Button
          Positioned(
            top: MediaQuery.of(context).padding.top + 16,
            right: 16,
            child: TextButton(
              onPressed: _navigate,
              style: TextButton.styleFrom(
                foregroundColor:
                    ThemeData.estimateBrightnessForColor(safeBgColor) ==
                        Brightness.dark
                    ? Colors.white70
                    : AppTheme.textSecondary,
              ),
              child: const Text('Skip'),
            ),
          ),
        ],
      ),
    );
  }
}
