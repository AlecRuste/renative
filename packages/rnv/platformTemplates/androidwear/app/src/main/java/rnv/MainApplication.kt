package {{APPLICATION_ID}}

import {{APPLICATION_ID}}.BuildConfig

import android.app.Application
import com.facebook.react.ReactApplication
import com.facebook.react.ReactNativeHost
import com.facebook.react.ReactPackage
import com.facebook.react.shell.MainReactPackage
import com.facebook.soloader.SoLoader
import java.util.Arrays

{{PLUGIN_IMPORTS}}

/**
 * Created by ReNative (https://renative.org)
 */

class MainApplication : Application(), ReactApplication {

    private val mReactNativeHost = object : ReactNativeHost(this) {
        override fun getUseDeveloperSupport(): Boolean = BuildConfig.DEBUG

        override fun getPackages(): List<ReactPackage> {
            return Arrays.asList<ReactPackage>(
{{PLUGIN_PACKAGES}}
            )
        }

        override fun getJSMainModuleName(): String = "{{ENTRY_FILE}}"

        //See src/common.js for the actual code
        override fun getJSBundleFile(): String? = {{GET_JS_BUNDLE_FILE}}
    }

    override fun getReactNativeHost(): ReactNativeHost = mReactNativeHost

    override fun onCreate() {
        super.onCreate()
        SoLoader.init(this, /* native exopackage */ false)
    }
}
